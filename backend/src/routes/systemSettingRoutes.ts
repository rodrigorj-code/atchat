import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import * as SystemSettingController from "../controllers/SystemSettingController";

const systemSettingRoutes = express.Router();

systemSettingRoutes.get(
  "/system-settings/branding",
  SystemSettingController.publicBranding
);

systemSettingRoutes.get(
  "/system-settings",
  isAuth,
  isSuper,
  SystemSettingController.index
);

systemSettingRoutes.put(
  "/system-settings",
  isAuth,
  isSuper,
  SystemSettingController.upsert
);

export default systemSettingRoutes;
