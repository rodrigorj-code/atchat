import express from "express";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";
import requireCompanyNotDelinquent from "../middleware/requireCompanyNotDelinquent";
import multer from "multer";
import uploadConfig from "../config/uploadExt";

import * as FlowBuilderController from "../controllers/FlowBuilderController";

const upload = multer(uploadConfig);

const flowBuilder = express.Router();

flowBuilder.post(
  "/flowbuilder",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  requireCompanyNotDelinquent,
  FlowBuilderController.createFlow
);

flowBuilder.put(
  "/flowbuilder",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  requireCompanyNotDelinquent,
  FlowBuilderController.updateFlow
);

flowBuilder.delete(
  "/flowbuilder/:idFlow",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  FlowBuilderController.deleteFlow
);

flowBuilder.get("/flowbuilder", isAuth,
  requireEffectiveModule("useFlowbuilders"), FlowBuilderController.myFlows);

flowBuilder.get("/flowbuilder/:idFlow", isAuth,
  requireEffectiveModule("useFlowbuilders"), FlowBuilderController.flowOne);

flowBuilder.post(
  "/flowbuilder/flow",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  requireCompanyNotDelinquent,
  FlowBuilderController.FlowDataUpdate
);

flowBuilder.post(
  "/flowbuilder/duplicate",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  requireCompanyNotDelinquent,
  FlowBuilderController.FlowDuplicate
);

flowBuilder.get(
  "/flowbuilder/flow/:idFlow",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  FlowBuilderController.FlowDataGetOne
);

flowBuilder.post(
  "/flowbuilder/img",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  requireCompanyNotDelinquent,
  upload.array("medias"),
  FlowBuilderController.FlowUploadImg
);

flowBuilder.post(
  "/flowbuilder/audio",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  requireCompanyNotDelinquent,
  upload.array("medias"),
  FlowBuilderController.FlowUploadAudio
);

flowBuilder.post(
  "/flowbuilder/content",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  requireCompanyNotDelinquent,
  upload.array('medias'),
  FlowBuilderController.FlowUploadAll
);

export default flowBuilder;