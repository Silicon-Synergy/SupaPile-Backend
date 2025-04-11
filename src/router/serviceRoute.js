import { Router } from "express";
import jwtVerification from "../middlewares/jwtVerification.js";
import { metaScrapper } from "../services/metaScrapper.js";
const metaScrapperRouter = Router();

metaScrapperRouter.get("/metaScrapper", metaScrapper);

export default metaScrapperRouter;
