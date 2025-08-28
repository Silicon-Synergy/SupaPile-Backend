import { Router } from "express";
import jwtVerification from "../middlewares/jwtVerification.js";
import {
  archivedPile,
  postPile,
  readPile,
  softDeletePile,
  generatePublicLink,
  getCurrentPublicLink,
  restorePile,
  hardDeletePile,
  changeCategory,
  listOfCategories,
  getClickedPile,
  changeVisibility,
  magicSave,
  createCategory,
  deleteCategory, // Add this import
} from "../controllers/actionController.js";
import { limiter } from "../middlewares/rateLimiter.js";
import { getCacheStats } from "../cache/cache-with-nodeCache.js";

const actionRouter = Router();

// ===== PILE RESOURCE ROUTES =====
// Collection routes (operate on multiple resources)
actionRouter.post("/piles", jwtVerification, postPile);                    // Create pile
actionRouter.get("/piles", jwtVerification, readPile);                     // Get all piles (with category query param)

// Specific collection endpoints (before parameterized routes)
actionRouter.get("/piles/archived", jwtVerification, archivedPile);        // Get archived piles
actionRouter.get("/piles/categories", jwtVerification, listOfCategories);  // Get all categories
actionRouter.post("/piles/categories", jwtVerification, createCategory);   // Create new category
actionRouter.delete("/piles/categories/:categoryName", jwtVerification, deleteCategory); // Delete category

// Individual resource routes (operate on single resources)
actionRouter.get("/piles/:id", jwtVerification, getClickedPile);           // Get specific pile
actionRouter.patch("/piles/:id", jwtVerification, changeCategory);         // Update pile (category)
actionRouter.delete("/piles/:id", jwtVerification, softDeletePile);        // Soft delete pile

// ===== PILE SUB-RESOURCE ROUTES =====
// Pile visibility management
actionRouter.patch("/piles/:id/visibility", jwtVerification, changeVisibility);

// Pile lifecycle management
actionRouter.patch("/piles/:id/restore", jwtVerification, restorePile);    // Restore soft-deleted pile
actionRouter.delete("/piles/:id/permanent", jwtVerification, hardDeletePile); // Permanent delete

// ===== PUBLIC LINK RESOURCE ROUTES =====
// Public link management as separate resource
actionRouter.get("/public-links", jwtVerification, getCurrentPublicLink);   // Get current public link
actionRouter.post("/public-links", jwtVerification, limiter, generatePublicLink); // Generate new public link

// ===== SYSTEM RESOURCE ROUTES =====
// Cache management
actionRouter.get("/cache/stats", (req, res) => {
  const stats = getCacheStats();
  res.json({
    success: true,
    message: "Cache statistics",
    data: stats,
  });
});

// Add this route before the parameterized routes
actionRouter.get("/magic-save/*", jwtVerification, magicSave);

export default actionRouter;
