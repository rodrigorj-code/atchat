import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";

/**
 * Exige plano com useExternalApi após tokenAuth (req.apiWhatsapp preenchido).
 */
const externalApiPlanAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const whatsapp = req.apiWhatsapp;
  if (!whatsapp) {
    return next(new AppError("ERR_INVALID_API_TOKEN", 401));
  }

  const plan = whatsapp.company?.plan;
  if (!plan || !plan.useExternalApi) {
    return next(new AppError("ERR_EXTERNAL_API_NOT_ALLOWED", 403));
  }

  return next();
};

export default externalApiPlanAuth;
