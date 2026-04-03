import { Request, Response, NextFunction } from "express";
import Company from "../models/Company";
import AppError from "../errors/AppError";
import { getCompanyFinanceFlags } from "../helpers/companyFinanceStatus";

/**
 * Bloqueia ações de alto impacto quando a empresa está inadimplente (dueDate vencido).
 * Não aplicar em login, faturas, PIX, webhooks ou leituras.
 */
const requireCompanyNotDelinquent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let companyId: number | undefined = req.user?.companyId;
  if (companyId === undefined && req.apiWhatsapp?.companyId != null) {
    companyId = req.apiWhatsapp.companyId;
  }
  if (companyId === undefined) {
    return next(new AppError("ERR_SESSION_EXPIRED", 401));
  }

  const company = await Company.findByPk(companyId);
  if (!company) {
    return next(new AppError("ERR_NO_COMPANY_FOUND", 404));
  }

  const { delinquent } = getCompanyFinanceFlags(company);
  if (delinquent) {
    return next(new AppError("ERR_COMPANY_DELINQUENT", 403));
  }

  return next();
};

export default requireCompanyNotDelinquent;
