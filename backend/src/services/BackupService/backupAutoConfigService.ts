import { Op } from "sequelize";
import SystemSetting from "../../models/SystemSetting";

const KEYS = {
  ENABLED: "backupAutoEnabled",
  FREQUENCY: "backupAutoFrequency",
  TIME: "backupAutoTime",
  WEEKDAY: "backupAutoWeekday",
  RETENTION: "backupAutoRetention"
} as const;

export interface BackupAutoConfigPayload {
  backupAutoEnabled: boolean;
  backupAutoFrequency: "daily" | "weekly";
  backupAutoTime: string;
  backupAutoWeekday: number;
  backupAutoRetention: number;
}

function parseTime(raw: string | undefined): string {
  if (!raw || typeof raw !== "string") return "03:00";
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(raw.trim());
  if (!m) return "03:00";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export async function getBackupAutoConfig(): Promise<BackupAutoConfigPayload> {
  const rows = await SystemSetting.findAll({
    where: { key: { [Op.in]: Object.values(KEYS) } }
  });
  const map = new Map(rows.map((r) => [r.key, r.value ?? ""]));

  const freqRaw = (map.get(KEYS.FREQUENCY) || "daily").toLowerCase();
  const frequency: "daily" | "weekly" = freqRaw === "weekly" ? "weekly" : "daily";

  let weekday = parseInt(String(map.get(KEYS.WEEKDAY) ?? "0"), 10);
  if (Number.isNaN(weekday)) weekday = 0;
  weekday = Math.min(6, Math.max(0, weekday));

  let retention = parseInt(String(map.get(KEYS.RETENTION) ?? "7"), 10);
  if (Number.isNaN(retention)) retention = 7;
  retention = Math.min(365, Math.max(1, retention));

  return {
    backupAutoEnabled: map.get(KEYS.ENABLED) === "true",
    backupAutoFrequency: frequency,
    backupAutoTime: parseTime(map.get(KEYS.TIME)),
    backupAutoWeekday: weekday,
    backupAutoRetention: retention
  };
}

export async function upsertBackupAutoConfig(
  partial: Partial<BackupAutoConfigPayload>
): Promise<BackupAutoConfigPayload> {
  const current = await getBackupAutoConfig();
  const next: BackupAutoConfigPayload = { ...current, ...partial };

  if (next.backupAutoFrequency !== "daily" && next.backupAutoFrequency !== "weekly") {
    next.backupAutoFrequency = "daily";
  }
  next.backupAutoTime = parseTime(next.backupAutoTime);
  next.backupAutoWeekday = Math.min(6, Math.max(0, Math.floor(next.backupAutoWeekday)));
  next.backupAutoRetention = Math.min(365, Math.max(1, Math.floor(next.backupAutoRetention)));

  const pairs: [string, string][] = [
    [KEYS.ENABLED, next.backupAutoEnabled ? "true" : "false"],
    [KEYS.FREQUENCY, next.backupAutoFrequency],
    [KEYS.TIME, next.backupAutoTime],
    [KEYS.WEEKDAY, String(next.backupAutoWeekday)],
    [KEYS.RETENTION, String(next.backupAutoRetention)]
  ];

  for (const [key, value] of pairs) {
    await SystemSetting.upsert({ key, value });
  }

  return getBackupAutoConfig();
}
