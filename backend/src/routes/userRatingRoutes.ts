import express from "express";
import isAuth from "../middleware/isAuth";
import * as UserRatingController from "../controllers/UserRatingController";

const routes = express.Router();

routes.get("/user-ratings", isAuth, UserRatingController.index);
routes.get("/user-ratings/summary", isAuth, UserRatingController.summary);

export default routes;
