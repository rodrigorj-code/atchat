import express from "express";
import isAuth from "../middleware/isAuth";
import requireCompanyNotDelinquent from "../middleware/requireCompanyNotDelinquent";
import multer from "multer";
import uploadConfig from "../config/uploadExt";

import * as FlowCampaignController from "../controllers/FlowCampaignController";


const flowCampaignRoutes = express.Router();

flowCampaignRoutes.post(
  "/flowcampaign",
  isAuth,
  requireCompanyNotDelinquent,
  FlowCampaignController.createFlowCampaign
);

flowCampaignRoutes.get("/flowcampaign", isAuth, FlowCampaignController.flowCampaigns);

flowCampaignRoutes.get("/flowcampaign/:idFlow", isAuth, FlowCampaignController.flowCampaign);

flowCampaignRoutes.put(
  "/flowcampaign",
  isAuth,
  requireCompanyNotDelinquent,
  FlowCampaignController.updateFlowCampaign
);

flowCampaignRoutes.delete(
  "/flowcampaign/:idFlow",
  isAuth,
  FlowCampaignController.deleteFlowCampaign
);

export default flowCampaignRoutes;
