import { Router } from "express";
import jwtVerification from "../middlewares/jwtVerification.js";
import {
  archivedPile,
  postPile,
  readPile,
  softDeletePile,
  generatePublicLink,
  restorePile,
  hardDeletePile,
  changeCategory,
  listOfCategories,
  getClickedPile,
  changeVisibility,
} from "../controllers/actionController.js";
import { limiter } from "../middlewares/rateLimiter.js";
const actionRouter = Router();

actionRouter.post("/post-pile", jwtVerification, postPile);
actionRouter.get("/read-pile/:category", jwtVerification, readPile);
actionRouter.put("/soft-delete-pile", jwtVerification, softDeletePile);
actionRouter.get("/archived-pile", jwtVerification, archivedPile);
actionRouter.get(
  "/generate-public-link",
  jwtVerification,
  limiter,
  generatePublicLink
);
actionRouter.put("/restore-pile", jwtVerification, restorePile);
actionRouter.put("/hard-delete-pile", jwtVerification, hardDeletePile);
actionRouter.post("/change-pile-category", jwtVerification, changeCategory);
actionRouter.get("/list-of-category", jwtVerification, listOfCategories);
actionRouter.post("/get-clicked-pile", jwtVerification, getClickedPile);
actionRouter.put("/change-visibility", jwtVerification, changeVisibility);
export default actionRouter;
