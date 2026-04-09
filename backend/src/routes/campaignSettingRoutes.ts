import express from "express";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";

import * as CampaignSettingController from "../controllers/CampaignSettingController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get(
  "/campaign-settings",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  CampaignSettingController.index
);

routes.post(
  "/campaign-settings",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  CampaignSettingController.store
);

export default routes;
