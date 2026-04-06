import moment from "moment-timezone";
import Company from "../models/Company";

export const DEFAULT_COMPANY_TIMEZONE = "America/Sao_Paulo";

export function resolveCompanyTimezone(raw?: string | null): string {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return DEFAULT_COMPANY_TIMEZONE;
  }
  const tz = raw.trim();
  if (!moment.tz.zone(tz)) {
    return DEFAULT_COMPANY_TIMEZONE;
  }
  return tz;
}

export async function getCompanyTimezoneById(companyId: number): Promise<string> {
  const company = await Company.findByPk(companyId, { attributes: ["timezone"] });
  return resolveCompanyTimezone(company?.timezone);
}

/**
 * Interpreta data/hora do agendamento único no fuso da empresa e retorna instante em UTC.
 * Strings com offset explícito (Z ou ±HH:mm) são tratadas como instantes absolutos.
 */
export function parseSendAtLocalToUtc(sendAt: string, timezone: string): Date {
  const tz = resolveCompanyTimezone(timezone);
  const s = String(sendAt).trim();
  if (s.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(s)) {
    const u = moment.utc(s, moment.ISO_8601, true);
    if (u.isValid()) {
      return u.toDate();
    }
  }
  const m = moment.tz(s, "YYYY-MM-DDTHH:mm", true, tz);
  if (m.isValid()) {
    return m.utc().toDate();
  }
  const m2 = moment.tz(s, "YYYY-MM-DD HH:mm", true, tz);
  if (m2.isValid()) {
    return m2.utc().toDate();
  }
  const m3 = moment.tz(s, moment.ISO_8601, true, tz);
  if (m3.isValid()) {
    return m3.utc().toDate();
  }
  throw new Error("INVALID_SEND_AT");
}
