import express from "express";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";
import requireCompanyNotDelinquent from "../middleware/requireCompanyNotDelinquent";

import * as ScheduleController from "../controllers/ScheduleController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const scheduleRoutes = express.Router();

scheduleRoutes.get("/schedules", isAuth,
  requireEffectiveModule("useSchedules"), ScheduleController.index);

scheduleRoutes.post(
  "/schedules",
  isAuth,
  requireEffectiveModule("useSchedules"),
  requireCompanyNotDelinquent,
  ScheduleController.store
);

scheduleRoutes.put("/schedules/:scheduleId", isAuth,
  requireEffectiveModule("useSchedules"), ScheduleController.update);

scheduleRoutes.get("/schedules/:scheduleId", isAuth,
  requireEffectiveModule("useSchedules"), ScheduleController.show);

scheduleRoutes.delete("/schedules/:scheduleId", isAuth,
  requireEffectiveModule("useSchedules"), ScheduleController.remove);

scheduleRoutes.post(
  "/schedules/:id/media-upload",
  isAuth,
  requireEffectiveModule("useSchedules"),
  requireCompanyNotDelinquent,
  upload.array("file"),
  ScheduleController.mediaUpload
);

scheduleRoutes.delete("/schedules/:id/media-upload", isAuth,
  requireEffectiveModule("useSchedules"), ScheduleController.deleteMedia);

export default scheduleRoutes;
