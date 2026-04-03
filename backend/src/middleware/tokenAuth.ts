import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import Company from "../models/Company";
import Plan from "../models/Plan";

const tokenAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== "string") {
    return next(new AppError("ERR_INVALID_API_TOKEN", 401));
  }

  if (!auth.startsWith("Bearer ")) {
    return next(new AppError("ERR_INVALID_API_TOKEN", 401));
  }

  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return next(new AppError("ERR_INVALID_API_TOKEN", 401));
  }

  try {
    const whatsapp = await Whatsapp.findOne({
      where: { token },
      include: [
        {
          model: Company,
          include: [{ model: Plan }]
        }
      ]
    });

    if (!whatsapp) {
      return next(new AppError("ERR_INVALID_API_TOKEN", 401));
    }

    Object.assign(req.params, { whatsappId: whatsapp.id.toString() });
    req.apiWhatsapp = whatsapp;
  } catch {
    return next(new AppError("ERR_INVALID_API_TOKEN", 401));
  }

  return next();
};

export default tokenAuth;
