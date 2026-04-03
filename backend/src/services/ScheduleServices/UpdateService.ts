import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Schedule from "../../models/Schedule";
import ShowService from "./ShowService";
import Whatsapp from "../../models/Whatsapp";

interface ScheduleData {
  id?: number;
  body?: string;
  sendAt?: string;
  sentAt?: string;
  contactId?: number;
  companyId?: number;
  ticketId?: number;
  userId?: number;
  preferredWhatsappId?: number | null;
}

interface Request {
  scheduleData: ScheduleData;
  id: string | number;
  companyId: number;
}

const UpdateUserService = async ({
  scheduleData,
  id,
  companyId
}: Request): Promise<Schedule | undefined> => {
  const schedule = await ShowService(id, companyId);

  const schema = Yup.object().shape({
    body: Yup.string().min(5)
  });

  const {
    body,
    sendAt,
    sentAt,
    contactId,
    ticketId,
    userId,
    preferredWhatsappId
  } = scheduleData;

  try {
    await schema.validate({ body });
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

  await schedule.update({
    body,
    sendAt,
    sentAt,
    contactId,
    ticketId,
    userId,
    ...(preferredWhatsappId !== undefined
      ? { preferredWhatsappId: preferredWhatsappId || null }
      : {})
  });

  return ShowService(id, companyId);
};

export default UpdateUserService;
