import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Schedule from "../../models/Schedule";
import Whatsapp from "../../models/Whatsapp";
import Contact from "../../models/Contact";
import User from "../../models/User";

interface Request {
  body: string;
  sendAt: string;
  contactId: number | string;
  companyId: number | string;
  userId?: number | string;
  preferredWhatsappId?: number | null;
}

const CreateService = async ({
  body,
  sendAt,
  contactId,
  companyId,
  userId,
  preferredWhatsappId
}: Request): Promise<Schedule> => {
  const schema = Yup.object().shape({
    body: Yup.string().required().min(5),
    sendAt: Yup.string().required()
  });

  try {
    await schema.validate({ body, sendAt });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (preferredWhatsappId) {
    const w = await Whatsapp.findOne({
      where: { id: preferredWhatsappId, companyId }
    });
    if (!w) {
      throw new AppError("Conexão WhatsApp inválida para esta empresa", 400);
    }
  }

  const created = await Schedule.create({
    body,
    sendAt,
    contactId,
    companyId,
    userId,
    preferredWhatsappId: preferredWhatsappId || null,
    status: "PENDENTE"
  });

  const schedule = await Schedule.findByPk(created.id, {
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name"] },
      { model: User, as: "user", attributes: ["id", "name"] },
      {
        model: Whatsapp,
        as: "preferredWhatsapp",
        attributes: ["id", "name", "status"],
        required: false
      }
    ]
  });

  return schedule!;
};

export default CreateService;
