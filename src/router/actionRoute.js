import { Router } from "express";
import jwtVerification from "../middlewares/jwtVerification.js";
import {
  archivedPile,
  postPile,
  readPile,
  softDeletePile,
} from "../controllers/actionController.js";

const actionRouter = Router();

actionRouter.post("/post-pile", jwtVerification, postPile);
actionRouter.get("/read-pile", jwtVerification, readPile);
actionRouter.put("/soft-delete-pile", jwtVerification, softDeletePile);
actionRouter.get("/archived-pile", jwtVerification, archivedPile);

export default actionRouter;
