import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Schedule from "../../models/Schedule";
import Whatsapp from "../../models/Whatsapp";
import Contact from "../../models/Contact";
import User from "../../models/User";
import ScheduleContact from "../../models/ScheduleContact";
import syncScheduleContacts from "./SyncScheduleContactsService";
import { computeNextRunAfter, RecurrenceType } from "../../helpers/scheduleNextRun";
import {
  getCompanyTimezoneById,
  parseSendAtLocalToUtc
} from "../../helpers/companyTimezone";

function normalizeContactIds(
  contactIds?: (number | string)[],
  contactId?: number | string
): number[] {
  if (Array.isArray(contactIds) && contactIds.length > 0) {
    return [
      ...new Set(
        contactIds.map(c => Number(c)).filter(n => !Number.isNaN(n) && n > 0)
      )
    ];
  }
  if (contactId !== undefined && contactId !== "" && contactId !== null) {
    const n = Number(contactId);
    if (!Number.isNaN(n) && n > 0) {
      return [n];
    }
  }
  return [];
}

export function scheduleDefaultIncludes() {
  return [
    { model: Contact, as: "contact", attributes: ["id", "name", "number"] },
    { model: User, as: "user", attributes: ["id", "name"] },
    {
      model: Whatsapp,
      as: "preferredWhatsapp",
      attributes: ["id", "name", "status"],
      required: false
    },
    {
      model: ScheduleContact,
      as: "scheduleContacts",
      include: [
        { model: Contact, as: "contact", attributes: ["id", "name", "number"] }
      ]
    }
  ];
}

interface Request {
  body: string;
  sendAt?: string;
  contactId?: number | string;
  contactIds?: (number | string)[];
  companyId: number | string;
  userId?: number | string;
  preferredWhatsappId?: number | null;
  scheduleType?: string;
  recurrenceType?: string | null;
  recurrenceDaysOfWeek?: number[] | null;
  recurrenceDayOfMonth?: number | null;
  timeToSend?: string | null;
}

function normalizeTimeToSend(raw: string): string {
  const parts = raw.trim().split(":");
  const hh = String(Number(parts[0]) || 0).padStart(2, "0");
  const mm = String(Number(parts[1]) || 0).padStart(2, "0");
  return `${hh}:${mm}`;
}

const CreateService = async ({
  body,
  sendAt,
  contactId,
  contactIds,
  companyId,
  userId,
  preferredWhatsappId,
  scheduleType: scheduleTypeRaw,
  recurrenceType: recurrenceRaw,
  recurrenceDaysOfWeek,
  recurrenceDayOfMonth,
  timeToSend: timeToSendRaw
}: Request): Promise<Schedule> => {
  const scheduleType = scheduleTypeRaw === "recurring" ? "recurring" : "single";

  const companyTz = await getCompanyTimezoneById(Number(companyId));

  const ids = normalizeContactIds(contactIds, contactId);
  if (!ids.length) {
    throw new AppError("Selecione ao menos um contato", 400);
  }

  if (preferredWhatsappId) {
    const w = await Whatsapp.findOne({
      where: { id: preferredWhatsappId, companyId }
    });
    if (!w) {
      throw new AppError("Conexão WhatsApp inválida para esta empresa", 400);
    }
  }

  await Yup.object()
    .shape({
      body: Yup.string().required().min(5)
    })
    .validate({ body });

  let nextRunAt: Date | null = null;
  let payloadSendAt: Date | null = null;
  let recurrenceType: string | null = null;
  let recurrenceDaysStored: number[] | null = null;
  let recurrenceDayStored: number | null = null;
  let timeToSend: string | null = null;

  if (scheduleType === "recurring") {
    recurrenceType = recurrenceRaw || null;
    if (!recurrenceType || !["daily", "weekly", "monthly"].includes(recurrenceType)) {
      throw new AppError("Frequência recorrente inválida", 400);
    }
    if (!timeToSendRaw || typeof timeToSendRaw !== "string") {
      throw new AppError("Informe o horário do envio", 400);
    }
    timeToSend = normalizeTimeToSend(timeToSendRaw);

    if (recurrenceType === "weekly") {
      if (!recurrenceDaysOfWeek || !recurrenceDaysOfWeek.length) {
        throw new AppError("Selecione ao menos um dia da semana", 400);
      }
      recurrenceDaysStored = recurrenceDaysOfWeek.filter(
        d => Number.isInteger(d) && d >= 0 && d <= 6
      );
      if (!recurrenceDaysStored.length) {
        throw new AppError("Dias da semana inválidos", 400);
      }
    } else {
      recurrenceDaysStored = null;
    }

    if (recurrenceType === "monthly") {
      const dom = recurrenceDayOfMonth != null ? Number(recurrenceDayOfMonth) : 1;
      if (Number.isNaN(dom) || dom < 1 || dom > 31) {
        throw new AppError("Dia do mês inválido (1–31)", 400);
      }
      recurrenceDayStored = dom;
    } else {
      recurrenceDayStored = null;
    }

    nextRunAt = computeNextRunAfter(
      companyTz,
      undefined,
      recurrenceType as RecurrenceType,
      timeToSend,
      recurrenceDaysStored,
      recurrenceDayStored
    );

    payloadSendAt = nextRunAt;
  } else {
    if (!sendAt) {
      throw new AppError("Data e hora são obrigatórias", 400);
    }
    await Yup.object()
      .shape({
        sendAt: Yup.string().required()
      })
      .validate({ sendAt });
    try {
      payloadSendAt = parseSendAtLocalToUtc(sendAt, companyTz);
    } catch {
      throw new AppError("Data/hora inválida", 400);
    }
  }

  const created = await Schedule.create({
    body,
    sendAt: payloadSendAt,
    contactId: ids[0],
    companyId,
    userId,
    preferredWhatsappId: preferredWhatsappId || null,
    status: "PENDENTE",
    scheduleType,
    recurrenceType,
    recurrenceDaysOfWeek: recurrenceDaysStored,
    recurrenceDayOfMonth: recurrenceDayStored,
    timeToSend,
    lastRunAt: null,
    nextRunAt: scheduleType === "recurring" ? nextRunAt : null,
    isActive: true,
    sentAt: null
  });

  await syncScheduleContacts(created.id, Number(companyId), ids);

  const schedule = await Schedule.findByPk(created.id, {
    include: scheduleDefaultIncludes()
  });

  return schedule!;
};

export default CreateService;
