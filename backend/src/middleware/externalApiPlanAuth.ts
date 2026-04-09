import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import GetEffectiveModuleFlags from "../services/CompanyService/GetEffectiveModuleFlagsService";

/**
 * Exige plano + overrides com API externa liberada (após tokenAuth).
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

  const company = whatsapp.company;
  const plan = company?.plan;
  const eff = GetEffectiveModuleFlags(plan as any, company?.modulePermissions);
  if (!eff.useExternalApi) {
    return next(new AppError("ERR_EXTERNAL_API_NOT_ALLOWED", 403));
  }

  return next();
};

export default externalApiPlanAuth;
