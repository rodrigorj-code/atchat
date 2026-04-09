import express from "express";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";

import * as ContactListItemController from "../controllers/ContactListItemController";

const routes = express.Router();

routes.get(
  "/contact-list-items/list",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  ContactListItemController.findList
);

routes.get("/contact-list-items", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListItemController.index);

routes.get("/contact-list-items/:id", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListItemController.show);

routes.post("/contact-list-items", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListItemController.store);

routes.put("/contact-list-items/:id", isAuth,
  requireEffectiveModule("useCampaigns"), ContactListItemController.update);

routes.delete(
  "/contact-list-items/:id",
  isAuth,
  requireEffectiveModule("useCampaigns"),
  ContactListItemController.remove
);

export default routes;
