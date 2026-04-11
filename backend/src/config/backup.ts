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

export const BACKUP_FILENAME_PREFIX = "atendechat-backup-";
export const BACKUP_CONFIRM_PHRASE = "RESTAURAR";
