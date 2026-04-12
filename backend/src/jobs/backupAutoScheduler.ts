import cron from "node-cron";
import { createApplicationBackup } from "../services/BackupService/createApplicationBackup";
import { pruneAutomaticBackups } from "../services/BackupService/pruneAutomaticBackups";
import { getBackupAutoConfig } from "../services/BackupService/backupAutoConfigService";
import { logger } from "../utils/logger";

let jobRunning = false;
let lastRunKey: string | null = null;

/**
 * Cron cada minuto: se backup automático estiver ativo e o relógio coincidir com horário/frequência,
 * gera ZIP com o mesmo serviço do backup manual e aplica retenção só sobre backups automáticos.
 */
export function startBackupAutoScheduler(): void {
  cron.schedule("* * * * *", async () => {
    if (jobRunning) return;
    try {
      const cfg = await getBackupAutoConfig();
      if (!cfg.backupAutoEnabled) return;

      const parts = cfg.backupAutoTime.split(":");
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (Number.isNaN(h) || Number.isNaN(m)) return;

      const now = new Date();
      if (now.getHours() !== h || now.getMinutes() !== m) return;

      if (cfg.backupAutoFrequency === "weekly" && now.getDay() !== cfg.backupAutoWeekday) {
        return;
      }

      const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const runKey =
        cfg.backupAutoFrequency === "weekly"
          ? `${dayKey}-w${cfg.backupAutoWeekday}-${h}:${m}`
          : `${dayKey}-${h}:${m}`;

      if (lastRunKey === runKey) return;

      jobRunning = true;
      try {
        await createApplicationBackup({ backupSource: "automatic" });
        const removed = await pruneAutomaticBackups(cfg.backupAutoRetention);
        lastRunKey = runKey;
        logger.info(
          `[backup-auto] Concluído. Retenção=${cfg.backupAutoRetention}, removidos=${removed.length}`
        );
      } catch (e) {
        logger.error(e);
      } finally {
        jobRunning = false;
      }
    } catch (e) {
      logger.error(e);
    }
  });
}
