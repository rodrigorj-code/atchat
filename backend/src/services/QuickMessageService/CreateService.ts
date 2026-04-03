import * as Yup from "yup";
import { Op, Sequelize } from "sequelize";
import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";
import { normalizeQuickMessageShortcode } from "./quickMessageShortcode";

interface Data {
  shortcode: string;
  message: string;
  companyId: number | string;
  userId: number | string;
  category?: string | null;
}

const CreateService = async (data: Data): Promise<QuickMessage> => {
  const { shortcode, message, companyId, userId, category } = data;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required("ERR_QUICKMESSAGE_REQUIRED"),
    message: Yup.string().required("ERR_QUICKMESSAGE_REQUIRED")
  });

  try {
    await schema.validate({ shortcode, message });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const normalized = normalizeQuickMessageShortcode(shortcode);
  if (normalized.length < 2) {
    throw new AppError("O atalho deve ter pelo menos 2 caracteres (após normalizar).", 400);
  }

  const msg = String(message).trim();
  if (msg.length < 1) {
    throw new AppError("A mensagem não pode ficar vazia.", 400);
  }

  const duplicate = await QuickMessage.findOne({
    where: {
      companyId,
      userId,
      [Op.and]: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("shortcode"))),
        normalized
      )
    }
  });

  if (duplicate) {
    throw new AppError(
      "Já existe uma resposta rápida com este atalho para o seu usuário.",
      400
    );
  }

  const cat =
    category !== undefined && category !== null && String(category).trim() !== ""
      ? String(category).trim().slice(0, 120)
      : null;

  const record = await QuickMessage.create({
    shortcode: normalized,
    message: msg,
    companyId,
    userId,
    category: cat
  });

  return record;
};

export default CreateService;
