import moment, { Moment } from "moment-timezone";
import { resolveCompanyTimezone } from "./companyTimezone";

export type RecurrenceType = "daily" | "weekly" | "monthly";

/**
 * Calcula a próxima execução no fuso da empresa e devolve Date em UTC para persistir no banco.
 * @param fromUtc instante de referência (UTC); se omitido, usa "agora" no fuso da empresa
 */
export function computeNextRunAfter(
  timezone: string,
  fromUtc: Date | undefined,
  recurrenceType: RecurrenceType,
  timeToSend: string,
  recurrenceDaysOfWeek: number[] | null | undefined,
  recurrenceDayOfMonth: number | null | undefined
): Date {
  const tz = resolveCompanyTimezone(timezone);
  const from: Moment = fromUtc
    ? moment.utc(fromUtc).tz(tz)
    : moment.tz(tz);

  const parts = timeToSend.split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;

  let result: Moment;

  if (recurrenceType === "daily") {
    let candidate = from.clone().hour(h).minute(m).second(0).millisecond(0);
    if (candidate.isAfter(from)) {
      result = candidate;
    } else {
      result = candidate.add(1, "day");
    }
    return result.utc().toDate();
  }

  if (recurrenceType === "weekly") {
    const days =
      recurrenceDaysOfWeek && recurrenceDaysOfWeek.length
        ? [...new Set(recurrenceDaysOfWeek)].sort((a, b) => a - b)
        : [1];
    for (let add = 0; add <= 14; add++) {
      const candidate = from
        .clone()
        .add(add, "days")
        .hour(h)
        .minute(m)
        .second(0)
        .millisecond(0);
      if (days.includes(candidate.day()) && candidate.isAfter(from)) {
        return candidate.utc().toDate();
      }
    }
    result = from
      .clone()
      .add(1, "week")
      .hour(h)
      .minute(m)
      .second(0)
      .millisecond(0);
    return result.utc().toDate();
  }

  if (recurrenceType === "monthly") {
    const dom = Math.min(Math.max(recurrenceDayOfMonth || 1, 1), 31);
    let candidate = from.clone().startOf("day");
    const lastThis = candidate.clone().endOf("month").date();
    candidate
      .date(Math.min(dom, lastThis))
      .hour(h)
      .minute(m)
      .second(0)
      .millisecond(0);
    if (candidate.isAfter(from)) {
      return candidate.utc().toDate();
    }
    candidate = candidate.add(1, "month").date(1);
    const lastNext = candidate.clone().endOf("month").date();
    candidate
      .date(Math.min(dom, lastNext))
      .hour(h)
      .minute(m)
      .second(0)
      .millisecond(0);
    return candidate.utc().toDate();
  }

  return from.clone().add(1, "day").utc().toDate();
}
