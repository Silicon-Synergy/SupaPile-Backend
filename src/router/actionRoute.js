import { Router } from "express";
import jwtVerification from "../middlewares/jwtVerification.js";
import {
  archived,
  postLink,
  softDeleteLink,
} from "../controllers/actionController.js";
import { readLink } from "../controllers/actionController.js";

const actionRouter = Router();

actionRouter.post("/post-link", jwtVerification, postLink);
actionRouter.get("/read-link", jwtVerification, readLink);
actionRouter.put("/soft-delete-link", jwtVerification, softDeleteLink);
actionRouter.get("/archived-link", jwtVerification, archived);

export default actionRouter;
