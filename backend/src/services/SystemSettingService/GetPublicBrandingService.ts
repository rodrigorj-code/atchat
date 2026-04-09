import { Op } from "sequelize";
import SystemSetting from "../../models/SystemSetting";

export const BRANDING_KEYS = {
  systemName: "systemName",
  loginLogoUrl: "loginLogoUrl",
  menuLogoUrl: "menuLogoUrl"
} as const;

export const DEFAULT_BRANDING = {
  systemName: "Atendechat",
  loginLogoUrl: "",
  menuLogoUrl: ""
};

export type PublicBranding = {
  systemName: string;
  loginLogoUrl: string;
  menuLogoUrl: string;
};

const GetPublicBrandingService = async (): Promise<PublicBranding> => {
  const rows = await SystemSetting.findAll({
    where: {
      key: {
        [Op.in]: [
          BRANDING_KEYS.systemName,
          BRANDING_KEYS.loginLogoUrl,
          BRANDING_KEYS.menuLogoUrl
        ]
      }
    }
  });

  const map: Record<string, string> = {};
  rows.forEach((r) => {
    map[r.key] = r.value ?? "";
  });

  return {
    systemName: map[BRANDING_KEYS.systemName] || DEFAULT_BRANDING.systemName,
    loginLogoUrl: map[BRANDING_KEYS.loginLogoUrl] ?? DEFAULT_BRANDING.loginLogoUrl,
    menuLogoUrl: map[BRANDING_KEYS.menuLogoUrl] ?? DEFAULT_BRANDING.menuLogoUrl
  };
};

export default GetPublicBrandingService;
