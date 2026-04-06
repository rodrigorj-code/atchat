import * as Yup from "yup";
import moment from "moment-timezone";

import AppError from "../../errors/AppError";
import Schedule from "../../models/Schedule";
import ShowService from "./ShowService";
import Whatsapp from "../../models/Whatsapp";
import syncScheduleContacts from "./SyncScheduleContactsService";
import { computeNextRunAfter, RecurrenceType } from "../../helpers/scheduleNextRun";
import {
  getCompanyTimezoneById,
  parseSendAtLocalToUtc
} from "../../helpers/companyTimezone";
import { scheduleDefaultIncludes } from "./CreateService";

interface ScheduleData {
  id?: number;
  body?: string;
  sendAt?: string;
  sentAt?: string;
  contactId?: number;
  contactIds?: number[];
  companyId?: number;
  ticketId?: number;
  userId?: number;
  preferredWhatsappId?: number | null;
  scheduleType?: string;
  recurrenceType?: string | null;
  recurrenceDaysOfWeek?: number[] | null;
  recurrenceDayOfMonth?: number | null;
  timeToSend?: string | null;
  isActive?: boolean;
}

interface Request {
  scheduleData: ScheduleData;
  id: string | number;
  companyId: number;
}

function normalizeTimeToSend(raw: string): string {
  const parts = raw.trim().split(":");
  const hh = String(Number(parts[0]) || 0).padStart(2, "0");
  const mm = String(Number(parts[1]) || 0).padStart(2, "0");
  return `${hh}:${mm}`;
}

const UpdateUserService = async ({
  scheduleData,
  id,
  companyId
}: Request): Promise<Schedule | undefined> => {
  const schedule = await ShowService(id, companyId);
  const companyTz = await getCompanyTimezoneById(companyId);

  const {
    body,
    sendAt,
    sentAt,
    contactId,
    contactIds,
    ticketId,
    userId,
    preferredWhatsappId,
    scheduleType: scheduleTypeRaw,
    recurrenceType: recurrenceRaw,
    recurrenceDaysOfWeek,
    recurrenceDayOfMonth,
    timeToSend: timeToSendRaw,
    isActive
  } = scheduleData;

  try {
    if (body !== undefined) {
      await Yup.object()
        .shape({
          body: Yup.string().min(5)
        })
        .validate({ body });
    }
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (preferredWhatsappId !== undefined && preferredWhatsappId !== null) {
    const w = await Whatsapp.findOne({
      where: { id: preferredWhatsappId, companyId }
    });
    if (!w) {
      throw new AppError("Conexão WhatsApp inválida para esta empresa", 400);
    }
  }

  const resolvedType =
    scheduleTypeRaw === "recurring"
      ? "recurring"
      : scheduleTypeRaw === "single"
        ? "single"
        : schedule.scheduleType || "single";

  const wasLegacySingle =
    !schedule.scheduleType || schedule.scheduleType === "single";

  if (schedule.sentAt && wasLegacySingle && resolvedType === "single") {
    throw new AppError("Agendamento único já enviado não pode ser editado", 400);
  }

  const patch: Record<string, unknown> = {};

  if (body !== undefined) {
    patch.body = body;
  }
  if (sendAt !== undefined) {
    if (resolvedType === "single") {
      try {
        patch.sendAt = parseSendAtLocalToUtc(sendAt, companyTz);
      } catch {
        throw new AppError("Data/hora inválida", 400);
      }
    } else {
      patch.sendAt = sendAt;
    }
  }
  if (sentAt !== undefined) {
    patch.sentAt = sentAt;
  }
  if (contactId !== undefined) {
    patch.contactId = contactId;
  }
  if (ticketId !== undefined) {
    patch.ticketId = ticketId;
  }
  if (userId !== undefined) {
    patch.userId = userId;
  }
  if (preferredWhatsappId !== undefined) {
    patch.preferredWhatsappId = preferredWhatsappId || null;
  }
  if (scheduleTypeRaw !== undefined) {
    patch.scheduleType = resolvedType;
  }
  if (isActive !== undefined) {
    patch.isActive = isActive;
  }

  const switchedToRecurring =
    scheduleTypeRaw === "recurring" && schedule.scheduleType !== "recurring";
  const recurrenceFieldsTouched =
    recurrenceRaw !== undefined ||
    recurrenceDaysOfWeek !== undefined ||
    recurrenceDayOfMonth !== undefined ||
    timeToSendRaw !== undefined;

  if (resolvedType === "recurring") {
    const recType = (recurrenceRaw ?? schedule.recurrenceType) as string | null;
    if (
      switchedToRecurring ||
      recurrenceFieldsTouched ||
      schedule.scheduleType === "recurring"
    ) {
      if (!recType || !["daily", "weekly", "monthly"].includes(recType)) {
        throw new AppError("Frequência recorrente inválida", 400);
      }
    }

    const tts =
      timeToSendRaw !== undefined && timeToSendRaw !== null && timeToSendRaw !== ""
        ? normalizeTimeToSend(String(timeToSendRaw))
        : schedule.timeToSend;
    if (
      (switchedToRecurring || recurrenceFieldsTouched || schedule.scheduleType === "recurring") &&
      !tts
    ) {
      throw new AppError("Informe o horário do envio", 400);
    }

    if (switchedToRecurring || recurrenceFieldsTouched) {
      if (!recType || !["daily", "weekly", "monthly"].includes(recType)) {
        throw new AppError("Frequência recorrente inválida", 400);
      }
      if (!tts) {
        throw new AppError("Informe o horário do envio", 400);
      }

      let daysStored: number[] | null =
        recurrenceDaysOfWeek !== undefined
          ? recurrenceDaysOfWeek
          : schedule.recurrenceDaysOfWeek;
      if (recType === "weekly") {
        if (!daysStored || !daysStored.length) {
          throw new AppError("Selecione ao menos um dia da semana", 400);
        }
        daysStored = daysStored.filter(
          d => Number.isInteger(d) && d >= 0 && d <= 6
        );
        if (!daysStored.length) {
          throw new AppError("Dias da semana inválidos", 400);
        }
      } else {
        daysStored = null;
      }

      let domStored: number | null =
        recurrenceDayOfMonth !== undefined
          ? recurrenceDayOfMonth
          : schedule.recurrenceDayOfMonth;
      if (recType === "monthly") {
        const dom = domStored != null ? Number(domStored) : 1;
        if (Number.isNaN(dom) || dom < 1 || dom > 31) {
          throw new AppError("Dia do mês inválido (1–31)", 400);
        }
        domStored = dom;
      } else {
        domStored = null;
      }

      patch.recurrenceType = recType;
      patch.recurrenceDaysOfWeek = daysStored;
      patch.recurrenceDayOfMonth = domStored;
      patch.timeToSend = tts;

      const next = computeNextRunAfter(
        companyTz,
        moment.utc().toDate(),
        recType as RecurrenceType,
        tts,
        daysStored,
        domStored
      );
      patch.nextRunAt = next;
      patch.sendAt = next;
    } else if (recurrenceRaw !== undefined) {
      patch.recurrenceType = recurrenceRaw;
    }
  } else if (resolvedType === "single") {
    if (scheduleTypeRaw === "single" || scheduleTypeRaw === undefined) {
      patch.recurrenceType = null;
      patch.recurrenceDaysOfWeek = null;
      patch.recurrenceDayOfMonth = null;
      patch.timeToSend = null;
      patch.nextRunAt = null;
      patch.lastRunAt = null;
    }
  }

  await schedule.update(patch as any);

  if (contactIds !== undefined && Array.isArray(contactIds)) {
    const unique = [...new Set(contactIds.map(Number).filter(n => n > 0))];
    if (!unique.length) {
      throw new AppError("Selecione ao menos um contato", 400);
    }
    await syncScheduleContacts(Number(id), companyId, unique);
    await schedule.update({ contactId: unique[0] });
  } else if (contactId !== undefined && contactId !== null) {
    await syncScheduleContacts(Number(id), companyId, [Number(contactId)]);
    await schedule.update({ contactId: Number(contactId) });
  }

  return (await Schedule.findByPk(id, {
    include: scheduleDefaultIncludes()
  })) as Schedule | undefined;
};

export default UpdateUserService;
