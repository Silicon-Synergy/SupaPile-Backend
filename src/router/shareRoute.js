import { Router } from "express";
import { userPublicLinkList } from "../controllers/actionController.js";
const shareRouter = Router();

shareRouter.get("/share/:uuID", userPublicLinkList);
export default shareRouter;
