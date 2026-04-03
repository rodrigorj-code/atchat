import * as Yup from "yup";
import { Op, Sequelize } from "sequelize";

import AppError from "../../errors/AppError";
import Tag from "../../models/Tag";

interface TagData {
  id?: number;
  name?: string;
  color?: string;
  kanban?: number;
}

interface Request {
  tagData: TagData;
  id: string | number;
  companyId: number;
}

const UpdateUserService = async ({
  tagData,
  id,
  companyId
}: Request): Promise<Tag | undefined> => {
  const tag = await Tag.findOne({
    where: { id, companyId }
  });

  if (!tag) {
    throw new AppError("ERR_NO_TAG_FOUND", 404);
  }

  const { name, color, kanban } = tagData;

  if (name !== undefined) {
    const schema = Yup.object().shape({
      name: Yup.string().trim().min(2).max(80).required()
    });
    try {
      await schema.validate({ name });
    } catch (err: any) {
      throw new AppError(err.message);
    }
  }

  if (name !== undefined && name.trim()) {
    const trimmed = name.trim();
    const duplicate = await Tag.findOne({
      where: {
        companyId,
        id: { [Op.ne]: tag.id },
        [Op.and]: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Tag.name")),
          trimmed.toLowerCase()
        )
      }
    });

    if (duplicate) {
      throw new AppError(
        "Já existe uma tag com este nome nesta empresa.",
        400
      );
    }
  }

  const payload: Partial<Tag> = {};
  if (name !== undefined) payload.name = name.trim();
  if (color !== undefined) payload.color = color;
  if (kanban !== undefined) payload.kanban = kanban;

  await tag.update(payload);

  await tag.reload();
  return tag;
};

export default UpdateUserService;
