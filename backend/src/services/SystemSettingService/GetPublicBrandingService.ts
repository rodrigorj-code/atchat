import { Op } from "sequelize";
import SystemSetting from "../../models/SystemSetting";

export const BRANDING_KEYS = {
  systemName: "systemName",
  loginLogoUrl: "loginLogoUrl",
  menuLogoUrl: "menuLogoUrl",
  faviconUrl: "faviconUrl",
  publicWhatsAppNumber: "publicWhatsAppNumber",
  publicWhatsAppMessage: "publicWhatsAppMessage"
} as const;

export const DEFAULT_BRANDING = {
  systemName: "CoreFlow",
  loginLogoUrl: "",
  menuLogoUrl: "",
  faviconUrl: "",
  publicWhatsAppNumber: "",
  publicWhatsAppMessage: ""
};

export type PublicBranding = {
  systemName: string;
  loginLogoUrl: string;
  menuLogoUrl: string;
  faviconUrl: string;
  /** Digits only, international format (e.g. 5527999999999). */
  publicWhatsAppNumber: string;
  /** Optional prefilled message for wa.me link. */
  publicWhatsAppMessage: string;
};

const GetPublicBrandingService = async (): Promise<PublicBranding> => {
  const rows = await SystemSetting.findAll({
    where: {
      key: {
        [Op.in]: [
          BRANDING_KEYS.systemName,
          BRANDING_KEYS.loginLogoUrl,
          BRANDING_KEYS.menuLogoUrl,
          BRANDING_KEYS.faviconUrl,
          BRANDING_KEYS.publicWhatsAppNumber,
          BRANDING_KEYS.publicWhatsAppMessage
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
    menuLogoUrl: map[BRANDING_KEYS.menuLogoUrl] ?? DEFAULT_BRANDING.menuLogoUrl,
    faviconUrl: map[BRANDING_KEYS.faviconUrl] ?? DEFAULT_BRANDING.faviconUrl,
    publicWhatsAppNumber:
      map[BRANDING_KEYS.publicWhatsAppNumber] ?? DEFAULT_BRANDING.publicWhatsAppNumber,
    publicWhatsAppMessage:
      map[BRANDING_KEYS.publicWhatsAppMessage] ?? DEFAULT_BRANDING.publicWhatsAppMessage
  };
};

export default GetPublicBrandingService;
