import { Router } from "express";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";

import * as QueueIntegrationController from "../controllers/QueueIntegrationController";

const queueIntegrationRoutes = Router();

queueIntegrationRoutes.get("/queueIntegration", isAuth,
  requireEffectiveModule("useIntegrations"), QueueIntegrationController.index);

queueIntegrationRoutes.post("/queueIntegration", isAuth,
  requireEffectiveModule("useIntegrations"), QueueIntegrationController.store);

queueIntegrationRoutes.get("/queueIntegration/:integrationId", isAuth,
  requireEffectiveModule("useIntegrations"), QueueIntegrationController.show);

queueIntegrationRoutes.put("/queueIntegration/:integrationId", isAuth,
  requireEffectiveModule("useIntegrations"), QueueIntegrationController.update);

queueIntegrationRoutes.delete("/queueIntegration/:integrationId", isAuth,
  requireEffectiveModule("useIntegrations"), QueueIntegrationController.remove);

export default queueIntegrationRoutes;