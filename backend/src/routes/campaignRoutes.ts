import express from "express";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";
import requireCompanyNotDelinquent from "../middleware/requireCompanyNotDelinquent";

import * as CampaignController from "../controllers/CampaignController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get("/campaigns/list", isAuth,
  requireEffectiveModule("useCampaigns"), CampaignController.findList);

routes.get(
  "/campaigns/contact-list-count",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  CampaignController.contactListCount
);

routes.get("/campaigns", isAuth,
  requireEffectiveModule("useCampaigns"), CampaignController.index);

routes.get(
  "/campaigns/tag-estimate",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  CampaignController.tagEstimate
);

routes.get(
  "/campaigns/:id/contacts-count",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  CampaignController.contactsCount
);

routes.get("/campaigns/:id/progress", isAuth,
  requireEffectiveModule("useCampaigns"), CampaignController.progress);

routes.get("/campaigns/:id", isAuth,
  requireEffectiveModule("useCampaigns"), CampaignController.show);

routes.post(
  "/campaigns",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  requireCompanyNotDelinquent,
  CampaignController.store
);

routes.post(
  "/campaigns/progress-batch",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  CampaignController.progressBatch
);

routes.put("/campaigns/:id", isAuth,
  requireEffectiveModule("useCampaigns"), CampaignController.update);

routes.delete("/campaigns/:id", isAuth,
  requireEffectiveModule("useCampaigns"), CampaignController.remove);

routes.post("/campaigns/:id/cancel", isAuth,
  requireEffectiveModule("useCampaigns"), CampaignController.cancel);

routes.post(
  "/campaigns/:id/restart",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  requireCompanyNotDelinquent,
  CampaignController.restart
);

routes.post(
  "/campaigns/:id/retry-failed",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  requireCompanyNotDelinquent,
  CampaignController.retryFailed
);

routes.post(
  "/campaigns/:id/media-upload",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  requireCompanyNotDelinquent,
  upload.array("file"),
  CampaignController.mediaUpload
);

routes.delete(
  "/campaigns/:id/media-upload",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  CampaignController.deleteMedia
);

export default routes;
