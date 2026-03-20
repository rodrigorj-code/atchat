import { Request, Response } from "express";
import RatingTemplate from "../models/RatingTemplate";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  const templates = await RatingTemplate.findAll({
    where: { companyId },
    order: [["createdAt", "DESC"]],
  });

  return res.status(200).json(templates);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { name, message, options } = req.body;

  const template = await RatingTemplate.create({
    companyId,
    name: name || "Avaliação",
    message: message || "",
    options: Array.isArray(options) ? options : [],
  });

  return res.status(201).json(template);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const { name, message, options } = req.body;

  const template = await RatingTemplate.findOne({
    where: { id, companyId },
  });

  if (!template) {
    return res.status(404).json({ error: "Template não encontrado" });
  }

  if (name !== undefined) template.name = name;
  if (message !== undefined) template.message = message;
  if (Array.isArray(options)) template.options = options;

  await template.save();

  return res.status(200).json(template);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;

  const template = await RatingTemplate.findOne({
    where: { id, companyId },
  });

  if (!template) {
    return res.status(404).json({ error: "Template não encontrado" });
  }

  await template.destroy();

  return res.status(200).json({ message: "Template removido" });
};
