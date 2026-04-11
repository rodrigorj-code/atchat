import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import AppError from "../errors/AppError";
import { getBackupsRoot, getIncomingRestoresDir, BACKUP_CONFIRM_PHRASE } from "../config/backup";
import { createApplicationBackup } from "../services/BackupService/createApplicationBackup";
import { listBackupFiles } from "../services/BackupService/listBackupFiles";
import { restoreFromValidatedZipFile } from "../services/BackupService/restoreFromZipFile";
import type { BackupManifest } from "../services/BackupService/createApplicationBackup";

function safeBackupFileName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  const base = path.basename(name);
  if (base !== name || base.includes("..")) return false;
  return /^atendechat-backup-.+\.zip$/.test(base);
}

export const list = async (_req: Request, res: Response): Promise<void> => {
  const items = await listBackupFiles();
  res.json({ backups: items });
};

export const generate = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await createApplicationBackup();
    res.status(201).json({
      ok: true,
      fileName: result.fileName,
      sizeBytes: result.sizeBytes,
      manifest: result.manifest
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("mysqldump") || msg.includes("pg_dump")) {
      throw new AppError(
        "BACKUP_DUMP_FAILED",
        500,
        "Verifique se mysqldump/pg_dump está no PATH e se as credenciais DB em .env estão corretas."
      );
    }
    throw err;
  }
};

export const download = async (req: Request, res: Response): Promise<void> => {
  const raw = req.params.fileName;
  if (!safeBackupFileName(raw)) {
    throw new AppError("BACKUP_INVALID_NAME", 400);
  }
  const abs = path.join(getBackupsRoot(), path.basename(raw));
  if (!fs.existsSync(abs)) {
    throw new AppError("BACKUP_NOT_FOUND", 404);
  }
  res.download(abs, path.basename(raw));
};

export const prepareRestore = async (req: Request, res: Response): Promise<void> => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file?.path) {
    throw new AppError("BACKUP_FILE_REQUIRED", 400);
  }

  let manifest: BackupManifest;
  try {
    const zip = new AdmZip(file.path);
    const m = zip.getEntry("manifest.json");
    const s = zip.getEntry("database.sql");
    if (!m || !s) {
      throw new Error("structure");
    }
    manifest = JSON.parse(m.getData().toString("utf8")) as BackupManifest;
    if (manifest.formatVersion !== 1) {
      throw new Error("version");
    }
  } catch {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new AppError("BACKUP_INVALID_ARCHIVE", 400);
  }

  const currentDialect = (process.env.DB_DIALECT || "mysql").toLowerCase();
  const backupDialect = (manifest.dbDialect || "").toLowerCase();
  if (backupDialect !== currentDialect) {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new AppError(
      "BACKUP_DIALECT_MISMATCH",
      400,
      `O backup é ${backupDialect} mas o servidor está ${currentDialect}.`
    );
  }

  const restoreToken = path.basename(file.filename, ".zip");

  res.json({
    ok: true,
    restoreToken,
    preview: {
      createdAt: manifest.createdAt,
      appVersion: manifest.appVersion,
      dbDialect: manifest.dbDialect,
      dbName: manifest.dbName,
      notes: manifest.notes
    }
  });
};

export const executeRestore = async (req: Request, res: Response): Promise<void> => {
  const { restoreToken, confirmPhrase } = req.body as {
    restoreToken?: string;
    confirmPhrase?: string;
  };

  if (!restoreToken || typeof restoreToken !== "string") {
    throw new AppError("BACKUP_TOKEN_REQUIRED", 400);
  }
  if (confirmPhrase !== BACKUP_CONFIRM_PHRASE) {
    throw new AppError("BACKUP_CONFIRM_REQUIRED", 400, `Digite exatamente: ${BACKUP_CONFIRM_PHRASE}`);
  }

  const safeToken = path.basename(restoreToken);
  if (!/^[a-f0-9-]{36}$/i.test(safeToken)) {
    throw new AppError("BACKUP_INVALID_TOKEN", 400);
  }

  const zipPath = path.join(getIncomingRestoresDir(), `${safeToken}.zip`);
  if (!fs.existsSync(zipPath)) {
    throw new AppError("BACKUP_UPLOAD_EXPIRED_OR_MISSING", 404);
  }

  try {
    const result = await restoreFromValidatedZipFile(zipPath);
    await fs.promises.unlink(zipPath).catch(() => {});
    res.json({
      ok: true,
      safetyBackupFileName: result.safetyBackupFileName,
      message:
        "Restauração concluída. Foi criado um backup de segurança antes da operação. Recomenda-se reiniciar o backend e reconectar sessões."
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith("BACKUP_")) {
      throw new AppError(msg, 400);
    }
    throw err;
  }
};
