import express from "express";
import isAuth from "../middleware/isAuth";
import * as RatingTemplateController from "../controllers/RatingTemplateController";

const routes = express.Router();

routes.get("/rating-templates", isAuth, RatingTemplateController.index);
routes.post("/rating-templates", isAuth, RatingTemplateController.store);
routes.put("/rating-templates/:id", isAuth, RatingTemplateController.update);
routes.delete("/rating-templates/:id", isAuth, RatingTemplateController.remove);

export default routes;
