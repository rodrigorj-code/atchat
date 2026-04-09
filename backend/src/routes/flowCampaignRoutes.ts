import express from "express";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";
import requireCompanyNotDelinquent from "../middleware/requireCompanyNotDelinquent";
import multer from "multer";
import uploadConfig from "../config/uploadExt";

import * as FlowCampaignController from "../controllers/FlowCampaignController";


const flowCampaignRoutes = express.Router();

flowCampaignRoutes.post(
  "/flowcampaign",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  requireCompanyNotDelinquent,
  FlowCampaignController.createFlowCampaign
);

flowCampaignRoutes.get("/flowcampaign", isAuth,
  requireEffectiveModule("useFlowbuilders"), FlowCampaignController.flowCampaigns);

flowCampaignRoutes.get("/flowcampaign/:idFlow", isAuth,
  requireEffectiveModule("useFlowbuilders"), FlowCampaignController.flowCampaign);

flowCampaignRoutes.put(
  "/flowcampaign",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  requireCompanyNotDelinquent,
  FlowCampaignController.updateFlowCampaign
);

flowCampaignRoutes.delete(
  "/flowcampaign/:idFlow",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  FlowCampaignController.deleteFlowCampaign
);

export default flowCampaignRoutes;
