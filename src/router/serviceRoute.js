import { Router } from "express";
import { metaScrapper } from "../services/metaScrapper.js";
const metaScrapperRouter = Router();

const youtubeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // allow 20 YouTube scrapes per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});
metaScrapperRouter.get("/", youtubeLimiter, metaScrapper);

export default metaScrapperRouter;
