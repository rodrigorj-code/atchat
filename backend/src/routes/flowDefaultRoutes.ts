import express from "express";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";

import * as FlowDefaultController from "../controllers/FlowDefaultController";

const flowDefaultRoutes = express.Router();

flowDefaultRoutes.post(
  "/flowdefault",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  FlowDefaultController.createFlowDefault
);

flowDefaultRoutes.put(
  "/flowdefault",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  FlowDefaultController.updateFlow
);

flowDefaultRoutes.get(
  "/flowdefault",
  isAuth,
  requireEffectiveModule("useFlowbuilders"),
  FlowDefaultController.getFlows
);

export default flowDefaultRoutes;