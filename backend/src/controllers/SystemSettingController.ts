import { Request, Response } from "express";

import GetPublicBrandingService, {
  PublicBranding
} from "../services/SystemSettingService/GetPublicBrandingService";
import UpsertBrandingService from "../services/SystemSettingService/UpsertBrandingService";
import SystemSetting from "../models/SystemSetting";

export const publicBranding = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const branding = await GetPublicBrandingService();
  return res.json(branding);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const rows = await SystemSetting.findAll({ order: [["key", "ASC"]] });
  const settings: Record<string, string> = {};
  rows.forEach((r) => {
    settings[r.key] = r.value ?? "";
  });
  const branding = await GetPublicBrandingService();
  return res.json({ settings, branding });
};

export const upsert = async (req: Request, res: Response): Promise<Response> => {
  const body = req.body as { branding?: Partial<PublicBranding> };
  if (body.branding && typeof body.branding === "object") {
    await UpsertBrandingService(body.branding);
  }
  const branding = await GetPublicBrandingService();
  return res.json(branding);
};
