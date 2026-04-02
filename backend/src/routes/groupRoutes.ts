import express from "express";
import isAuth from "../middleware/isAuth";
import * as GroupController from "../controllers/GroupController";

const groupRoutes = express.Router();

groupRoutes.post("/groups/create", isAuth, GroupController.create);
groupRoutes.post("/groups/join", isAuth, GroupController.join);
groupRoutes.post("/groups/leave", isAuth, GroupController.leave);
groupRoutes.post("/groups/open-conversation", isAuth, GroupController.openConversation);
groupRoutes.get("/groups/:whatsappId", isAuth, GroupController.list);

export default groupRoutes;
