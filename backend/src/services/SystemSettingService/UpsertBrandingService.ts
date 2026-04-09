import SystemSetting from "../../models/SystemSetting";
import { BRANDING_KEYS, PublicBranding } from "./GetPublicBrandingService";

const UpsertBrandingService = async (data: Partial<PublicBranding>): Promise<void> => {
  const entries: [string, string][] = [];
  if (data.systemName !== undefined) {
    entries.push([BRANDING_KEYS.systemName, String(data.systemName).trim()]);
  }
  if (data.loginLogoUrl !== undefined) {
    entries.push([BRANDING_KEYS.loginLogoUrl, String(data.loginLogoUrl).trim()]);
  }
  if (data.menuLogoUrl !== undefined) {
    entries.push([BRANDING_KEYS.menuLogoUrl, String(data.menuLogoUrl).trim()]);
  }

  for (const [key, value] of entries) {
    await SystemSetting.upsert({ key, value });
  }
};

export default UpsertBrandingService;
