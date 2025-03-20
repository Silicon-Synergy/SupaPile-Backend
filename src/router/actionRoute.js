import { Router } from "express";
import jwtVerification from "../middlewares/jwtVerification.js";
import { postLink } from "../controllers/actionController.js";
const actionRouter = Router();

actionRouter.post("/post-link", jwtVerification, postLink);
export default actionRouter;
