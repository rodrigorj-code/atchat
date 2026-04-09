import moment from "moment-timezone";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Setting from "../../models/Setting";

interface CompanyData {
  name: string;
  id?: number | string;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
  timezone?: string;
  /** Overrides de módulos (apenas Super Admin via API de empresas) */
  modulePermissions?: Record<string, boolean> | null;
}

const UpdateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const company = await Company.findByPk(companyData.id);
  const {
    name,
    phone,
    email,
    status,
    planId,
    campaignsEnabled,
    dueDate,
    recurrence,
    timezone,
    modulePermissions
  } = companyData;

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  if (timezone !== undefined) {
    const tz = String(timezone).trim();
    if (!tz || !moment.tz.zone(tz)) {
      throw new AppError("Fuso horário inválido", 400);
    }
  }

  await company.update({
    name,
    phone,
    email,
    status,
    planId,
    dueDate,
    recurrence,
    ...(timezone !== undefined ? { timezone: String(timezone).trim() } : {}),
    ...(modulePermissions !== undefined
      ? {
          modulePermissions:
            modulePermissions && typeof modulePermissions === "object"
              ? modulePermissions
              : {}
        }
      : {})
  });

  if (companyData.campaignsEnabled !== undefined) {
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "campaignsEnabled"
      },
      defaults: {
        companyId: company.id,
        key: "campaignsEnabled",
        value: `${campaignsEnabled}`
      }
    });
    if (!created) {
      await setting.update({ value: `${campaignsEnabled}` });
    }
  }

  return company;
};

export default UpdateCompanyService;
