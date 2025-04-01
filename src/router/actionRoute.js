import { Router } from "express";
import jwtVerification from "../middlewares/jwtVerification.js";
import {
  archivedPile,
  postPile,
  readPile,
  softDeletePile,
  userPublicList,
  generatePublicLink,
  restorePile,
  hardDeletePile,
  changeCategory,
} from "../controllers/actionController.js";

const actionRouter = Router();

actionRouter.post("/post-pile", jwtVerification, postPile);
actionRouter.get("/read-pile/:category", jwtVerification, readPile);
actionRouter.put("/soft-delete-pile", jwtVerification, softDeletePile);
actionRouter.get("/archived-pile", jwtVerification, archivedPile);
actionRouter.get("/generate-public-link", jwtVerification, generatePublicLink);
actionRouter.get("/restore-pile", jwtVerification, restorePile);
actionRouter.get("/hard-delete-pile", jwtVerification, hardDeletePile);
actionRouter.get("/change-pile-category", jwtVerification, changeCategory);

export default actionRouter;
