import moment from "moment-timezone";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";

const UpdateCompanyTimezoneService = async (
  id: string | number,
  timezone: string
): Promise<Company> => {
  const company = await Company.findByPk(id);

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  const tz = String(timezone || "").trim();
  if (!tz || !moment.tz.zone(tz)) {
    throw new AppError("Fuso horário inválido", 400);
  }

  await company.update({ timezone: tz });

  return company;
};

export default UpdateCompanyTimezoneService;
