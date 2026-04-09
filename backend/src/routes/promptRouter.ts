import { Router } from "express";
import * as PromptController from "../controllers/PromptController";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";


const promptRoutes = Router();

promptRoutes.get("/prompt", isAuth,
  requireEffectiveModule("useOpenAi"), PromptController.index);

promptRoutes.post("/prompt", isAuth,
  requireEffectiveModule("useOpenAi"), PromptController.store);

promptRoutes.get("/prompt/:promptId", isAuth,
  requireEffectiveModule("useOpenAi"), PromptController.show);

promptRoutes.put("/prompt/:promptId", isAuth,
  requireEffectiveModule("useOpenAi"), PromptController.update);

promptRoutes.delete("/prompt/:promptId", isAuth,
  requireEffectiveModule("useOpenAi"), PromptController.remove);

export default promptRoutes;
