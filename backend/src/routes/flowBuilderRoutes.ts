import express from "express";
import isAuth from "../middleware/isAuth";
import requireCompanyNotDelinquent from "../middleware/requireCompanyNotDelinquent";
import multer from "multer";
import uploadConfig from "../config/uploadExt";

import * as FlowBuilderController from "../controllers/FlowBuilderController";

const upload = multer(uploadConfig);

const flowBuilder = express.Router();

flowBuilder.post(
  "/flowbuilder",
  isAuth,
  requireCompanyNotDelinquent,
  FlowBuilderController.createFlow
);

flowBuilder.put(
  "/flowbuilder",
  isAuth,
  requireCompanyNotDelinquent,
  FlowBuilderController.updateFlow
);

flowBuilder.delete(
  "/flowbuilder/:idFlow",
  isAuth,
  FlowBuilderController.deleteFlow
);

flowBuilder.get("/flowbuilder", isAuth, FlowBuilderController.myFlows);

flowBuilder.get("/flowbuilder/:idFlow", isAuth, FlowBuilderController.flowOne);

flowBuilder.post(
  "/flowbuilder/flow",
  isAuth,
  requireCompanyNotDelinquent,
  FlowBuilderController.FlowDataUpdate
);

flowBuilder.post(
  "/flowbuilder/duplicate",
  isAuth,
  requireCompanyNotDelinquent,
  FlowBuilderController.FlowDuplicate
);

flowBuilder.get(
  "/flowbuilder/flow/:idFlow",
  isAuth,
  FlowBuilderController.FlowDataGetOne
);

flowBuilder.post(
  "/flowbuilder/img",
  isAuth,
  requireCompanyNotDelinquent,
  upload.array("medias"),
  FlowBuilderController.FlowUploadImg
);

flowBuilder.post(
  "/flowbuilder/audio",
  isAuth,
  requireCompanyNotDelinquent,
  upload.array("medias"),
  FlowBuilderController.FlowUploadAudio
);

flowBuilder.post(
  "/flowbuilder/content",
  isAuth,
  requireCompanyNotDelinquent,
  upload.array('medias'),
  FlowBuilderController.FlowUploadAll
);

export default flowBuilder;