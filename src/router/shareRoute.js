import { Router } from "express";
import { userPublicList } from "../controllers/actionController.js";

const shareRouter = Router();

shareRouter.get("/share/:uuID", userPublicList);
export default shareRouter;
