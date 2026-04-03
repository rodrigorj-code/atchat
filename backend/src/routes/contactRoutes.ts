import express from "express";
import isAuth from "../middleware/isAuth";

import * as ContactController from "../controllers/ContactController";
import * as ImportPhoneContactsController from "../controllers/ImportPhoneContactsController";

const contactRoutes = express.Router();

contactRoutes.post(
  "/contacts/import",
  isAuth,
  ImportPhoneContactsController.store
);

contactRoutes.get("/contacts", isAuth, ContactController.index);

contactRoutes.get("/contacts/list", isAuth, ContactController.list);

contactRoutes.get(
  "/contacts/:contactId/summary",
  isAuth,
  ContactController.summary
);

contactRoutes.post(
  "/contacts/:contactId/tags",
  isAuth,
  ContactController.addTag
);

contactRoutes.delete(
  "/contacts/:contactId/tags/:tagId",
  isAuth,
  ContactController.removeTag
);

contactRoutes.get("/contacts/:contactId", isAuth, ContactController.show);

contactRoutes.post("/contacts", isAuth, ContactController.store);

contactRoutes.post("/contacts/upload", isAuth, ContactController.storeUpload);

contactRoutes.put("/contacts/:contactId", isAuth, ContactController.update);

contactRoutes.delete("/contacts/:contactId", isAuth, ContactController.remove);

contactRoutes.put("/contacts/toggleDisableBot/:contactId", isAuth, ContactController.toggleDisableBot);

export default contactRoutes;
