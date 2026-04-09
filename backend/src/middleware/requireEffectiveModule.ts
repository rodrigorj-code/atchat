import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Company from "../models/Company";
import Plan from "../models/Plan";
import GetEffectiveModuleFlags, {
  EffectiveModuleFlags
} from "../services/CompanyService/GetEffectiveModuleFlagsService";

/**
 * Exige que o módulo esteja liberado para a empresa do token (plano + overrides).
 */
const requireEffectiveModule = (key: keyof EffectiveModuleFlags) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return next(new AppError("ERR_NO_PERMISSION", 403));
      }

      const company = await Company.findByPk(companyId, {
        include: [{ model: Plan, as: "plan" }]
      });

      const eff = GetEffectiveModuleFlags(company?.plan, company?.modulePermissions);
      if (!eff[key]) {
        return next(new AppError("ERR_MODULE_NOT_ALLOWED", 403));
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export default requireEffectiveModule;
