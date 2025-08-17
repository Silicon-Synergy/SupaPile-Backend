import { Router } from "express";
import jwtVerification from "../middlewares/jwtVerification.js";
import {
  archivedPile,
  postPile,
  readPile,
  softDeletePile,
  generatePublicLink,
  getCurrentPublicLink, // Add this
  restorePile,
  hardDeletePile,
  changeCategory,
  listOfCategories,
  getClickedPile,
  changeVisibility,
} from "../controllers/actionController.js";
import { limiter } from "../middlewares/rateLimiter.js";
import { getCacheStats } from "../cache/cache-with-nodeCache.js";
const actionRouter = Router();

actionRouter.post("/post-pile", jwtVerification, postPile);
actionRouter.get("/read-pile/:category", jwtVerification, readPile);
actionRouter.put("/soft-delete-pile", jwtVerification, softDeletePile);
actionRouter.get("/archived-pile", jwtVerification, archivedPile);
actionRouter.post(
  "/generate-public-link",
  jwtVerification,
  limiter,
  generatePublicLink
);
actionRouter.put("/restore-pile", jwtVerification, restorePile);
actionRouter.put("/hard-delete-pile", jwtVerification, hardDeletePile);
actionRouter.post("/change-pile-category", jwtVerification, changeCategory);
actionRouter.get("/list-of-category", jwtVerification, listOfCategories);
actionRouter.post("/get-clicked-pile", jwtVerification, getClickedPile);
actionRouter.put("/change-visibility", jwtVerification, changeVisibility);

actionRouter.get("/cache-stats", (req, res) => {
  const stats = getCacheStats();
  res.json({
    success: true,
    message: "Cache statistics",
    data: stats,
  });
});
// Add this new route
actionRouter.get("/current-public-link", jwtVerification, getCurrentPublicLink);
export default actionRouter;
