import { Router } from "express";
import { userPublicLinkList } from "../controllers/actionController.js";
const shareRouter = Router();

shareRouter.get("/share/:publicLinkToken", userPublicLinkList);
export default shareRouter;
