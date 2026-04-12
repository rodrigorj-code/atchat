import path from "path";
import fs from "fs";

/**
 * Caminho centralizado para evolução futura (Fase 2):
 * - agendamento: cron/node-cron a chamar o mesmo serviço `createApplicationBackup`
 * - retenção: apagar ficheiros ZIP mais antigos que N dias neste diretório
 * - nuvem: após gerar, enviar cópia para S3/Drive e opcionalmente remover local
 */
/** Diretório de armazenamento de backups gerados (fora de /public; só acesso via API autenticada). */
export function getBackupsRoot(): string {
  return path.resolve(__dirname, "..", "..", "backups");
}

export function getIncomingRestoresDir(): string {
  return path.join(getBackupsRoot(), "incoming");
}

export function ensureBackupDirs(): void {
  const root = getBackupsRoot();
  const incoming = getIncomingRestoresDir();
  if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
  if (!fs.existsSync(incoming)) fs.mkdirSync(incoming, { recursive: true });
}

/** Novos ficheiros gerados pela app. */
export const BACKUP_FILENAME_PREFIX = "coreflow-backup-";
/** Backups antigos (antes da renomeação interna) — mantido para listagem/restauro. */
export const LEGACY_BACKUP_FILENAME_PREFIX = "atendechat-backup-";

export const BACKUP_CONFIRM_PHRASE = "RESTAURAR";
export const BACKUP_DELETE_CONFIRM_PHRASE = "EXCLUIR";

/** ZIP gerado por esta aplicação (prefixo atual ou legado). */
export function isAppGeneratedBackupZipBaseName(base: string): boolean {
  if (!base || base.includes("..")) return false;
  return (
    base.startsWith(BACKUP_FILENAME_PREFIX) ||
    base.startsWith(LEGACY_BACKUP_FILENAME_PREFIX)
  );
}

/** Nomes de ZIP permitidos na pasta de backups (gerados pela app). */
export function isSafeBackupZipFileName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  const base = path.basename(name);
  if (base !== name || base.includes("..")) return false;
  return /^(coreflow-backup-|atendechat-backup-).+\.zip$/.test(base);
}
