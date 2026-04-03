import * as Yup from "yup";
import { Op, Sequelize } from "sequelize";

import AppError from "../../errors/AppError";
import Tag from "../../models/Tag";

interface Request {
  name: string;
  color: string;
  kanban: number;
  companyId: number;
}

const CreateService = async ({
  name,
  color = "#A4CCCC",
  kanban = 0,
  companyId
}: Request): Promise<Tag> => {
  const schema = Yup.object().shape({
    name: Yup.string().required().trim().min(2).max(80)
  });

  try {
    await schema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const trimmed = name.trim();

  const duplicate = await Tag.findOne({
    where: {
      companyId,
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

  const tag = await Tag.create({
    name: trimmed,
    color: color || "#A4CCCC",
    companyId,
    kanban
  });

  await tag.reload();

  return tag;
};

export default CreateService;
