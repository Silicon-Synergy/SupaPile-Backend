import { Router } from "express";
import { metaScrapper } from "../services/metaScrapper.js";
const metaScrapperRouter = Router();

metaScrapperRouter.get("/metaScrapper", metaScrapper);

export default metaScrapperRouter;
