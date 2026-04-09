import express from "express";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";
import uploadConfig from "../config/upload";

import * as ContactListController from "../controllers/ContactListController";
import multer from "multer";

const routes = express.Router();

const upload = multer(uploadConfig);

routes.get("/contact-lists/list", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListController.findList);

routes.get("/contact-lists", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListController.index);

routes.get("/contact-lists/:id", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListController.show);

routes.post("/contact-lists", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListController.store);

routes.post(
  "/contact-lists/:id/upload",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  upload.array("file"),
  ContactListController.upload
);

routes.put("/contact-lists/:id", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListController.update);

routes.delete("/contact-lists/:id", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListController.remove);

export default routes;
