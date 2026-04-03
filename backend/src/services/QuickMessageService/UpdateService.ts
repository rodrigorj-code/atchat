import { Op, Sequelize } from "sequelize";
import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";
import {
  normalizeQuickMessageShortcode
} from "./quickMessageShortcode";

interface Data {
  shortcode?: string;
  message?: string;
  category?: string | null;
  userId: number | string;
  companyId: number | string;
  id?: number | string;
}

const UpdateService = async (data: Data): Promise<QuickMessage> => {
  const { id, shortcode, message, category, userId, companyId } = data;

  const record = await QuickMessage.findOne({
    where: {
      id,
      companyId,
      userId
    }
  });

  if (!record) {
    throw new AppError("ERR_NO_QUICKMESSAGE_FOUND", 404);
  }

  const updates: Record<string, unknown> = {};

  if (shortcode !== undefined) {
    const normalized = normalizeQuickMessageShortcode(shortcode);
    if (normalized.length < 2) {
      throw new AppError("O atalho deve ter pelo menos 2 caracteres (após normalizar).", 400);
    }

    const duplicate = await QuickMessage.findOne({
      where: {
        companyId,
        userId,
        id: { [Op.ne]: record.id },
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

    updates.shortcode = normalized;
  }

  if (message !== undefined) {
    const msg = String(message).trim();
    if (msg.length < 1) {
      throw new AppError("A mensagem não pode ficar vazia.", 400);
    }
    updates.message = msg;
  }

  if (category !== undefined) {
    updates.category =
      category !== null && String(category).trim() !== ""
        ? String(category).trim().slice(0, 120)
        : null;
  }

  if (Object.keys(updates).length > 0) {
    await record.update(updates);
  }

  await record.reload();
  return record;
};

export default UpdateService;
