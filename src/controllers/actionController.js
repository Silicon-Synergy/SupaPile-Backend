import mongoose from "mongoose";
import Links from "../models/actionModel.js";
import { randomUUID } from "crypto";
import { generateMeta } from "../utilities/generateMeta.js";
import { generatePublicToken } from "../utilities/generateTokens.js";
import {
  categoriesCache,
  pilesCache,
  publicLinkCache,
} from "../cache/cache-with-nodeCache.js";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
dotenv.config();

export const postPile = async (req, res) => {
  try {
    let piles = req.body;
    const { id } = req.user;
    if (!Array.isArray(piles)) {
      piles = [piles];
    }
    let URLsToCheck = piles.map((pile) => pile.url);

    // Check for existing active piles
    const existingActivePile = await Links.find({
      userId: id,
      url: { $in: URLsToCheck },
      $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
    });

    // Check for existing archived piles
    const existingArchivedPile = await Links.find({
      userId: id,
      url: { $in: URLsToCheck },
      isArchived: true,
    });

    const existingActiveURLs = existingActivePile.map((pile) => pile.url);
    const existingArchivedURLs = existingArchivedPile.map((pile) => pile.url);

    // If there are active piles, return specific error
    if (existingActiveURLs.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This link already exists in your active piles.",
        existingUrls: existingActiveURLs,
        type: "active_duplicate",
      });
    }

    // If there are archived piles, return specific error
    if (existingArchivedURLs.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This link exists in your archived piles. Please restore it or use a different URL.",
        existingUrls: existingArchivedURLs,
        type: "archived_duplicate",
      });
    }

    // All URLs are new, proceed with creation
    const formatedNonExistingURLs = piles.map((pileToSend) => ({
      userId: id,
      ...pileToSend,
    }));

    // Clear both categories and piles cache when new items are added
    categoriesCache.del(`categories:${id}`);

    // Clear all piles cache entries for this user
    const cacheKeys = pilesCache.keys();
    const userPileKeys = cacheKeys.filter((key) =>
      key.startsWith(`piles:${id}:`)
    );
    userPileKeys.forEach((key) => pilesCache.del(key));

    console.log(formatedNonExistingURLs);

    const insertedLinks = await Links.insertMany(formatedNonExistingURLs);

    // Generate and update metadata for each new link
    await Promise.all(
      insertedLinks.map(async (pile) => {
        try {
          const meta = await generateMeta({ url: pile.url, id: pile._id });
          await Links.updateOne(
            { _id: pile._id },
            {
              $set: {
                image: meta.image,
                title: meta.title,
                description: meta.description,
              },
            }
          );
        } catch (err) {
          console.log("Meta generation failed for:", pile.url, err);
        }
      })
    );

    return res.status(200).json({
      success: true,
      saved: formatedNonExistingURLs.map((p) => p.url),
      message: "Links saved successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while saving links.",
      error: error.message,
    });
  }
};

export const magicSave = async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    const { id } = req.user;

    // Validate URL is HTTPS only
    if (!url.startsWith("https://")) {
      return res.status(400).json({
        success: false,
        message:
          "Only secure HTTPS URLs are allowed. HTTP URLs are not permitted for security reasons.",
        url: url,
      });
    }

    // Check if URL already exists
    const existingPile = await Links.findOne({
      userId: id,
      url: url,
      isArchived: true,
    });

    if (existingPile) {
      return res.status(409).json({
        success: false,
        message: "This link already exists in your pile.",
        url: url,
      });
    }

    // Create new pile object
    const newPile = {
      userId: id,
      url: url,
      category: "Uncategorized", // default category
    };

    // Clear cache
    categoriesCache.del(`categories:${id}`);
    const cacheKeys = pilesCache.keys();
    const userPileKeys = cacheKeys.filter((key) =>
      key.startsWith(`piles:${id}:`)
    );
    userPileKeys.forEach((key) => pilesCache.del(key));

    // Insert the new link
    const insertedLink = await Links.create(newPile);

    // Generate metadata in background
    try {
      const meta = await generateMeta({
        url: insertedLink.url,
        id: insertedLink._id,
      });
      await Links.updateOne(
        { _id: insertedLink._id },
        {
          $set: {
            image: meta.image,
            title: meta.title,
            description: meta.description,
          },
        }
      );
    } catch (err) {
      console.log("Meta generation failed for:", insertedLink.url, err);
    }

    return res.status(200).json({
      success: true,
      message: "Secure link saved successfully!",
      url: url,
      id: insertedLink._id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save link",
      error: error.message,
    });
  }
};

export const readPile = async (req, res) => {
  const { id } = req.user;
  let { category = "all", lastId, keyword, limit = 18 } = req.query;

  // Generate cache key based on all query parameters
  const cacheKey = `piles:${id}:${category}:${lastId || "first"}:${
    keyword || "no-search"
  }:${limit}`;

  // Check cache first
  const cachedResult = pilesCache.get(cacheKey);
  if (cachedResult) {
    return res.status(200).json({ success: true, data: cachedResult });
  }

  try {
    let piles;
    let query = { userId: id, isArchived: false };

    if (lastId && mongoose.Types.ObjectId.isValid(lastId)) {
      query._id = { $lt: new mongoose.Types.ObjectId(lastId) };
    }

    if (category !== "all") {
      query.category = category;
    }

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { url: { $regex: keyword, $options: "i" } },
        { category: { $regex: keyword, $options: "i" } },
      ];
    }

    piles = await Links.find(query)
      .select([
        "_id",
        "url",
        "image",
        "title",
        "description",
        "visibility",
        "category",
      ])
      .sort({ _id: -1 })
      .limit(Number(limit))
      .lean();

    const totalCount = await Links.countDocuments(query);
    const hasMore = piles.length === Number(limit);
    const newLastId = piles.length > 0 ? piles[piles.length - 1]._id : null;
    const results = piles.map((pile) => ({ id: pile._id, url: pile.url }));

    if (!piles || piles.length <= 0) {
      return res.json({ message: "doesn't exist" });
    }

    // Cache the result before returning
    const result = { piles, hasMore, newLastId };
    pilesCache.set(cacheKey, result, 300); // 5 minutes TTL

    console.log(piles);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while reading piles.",
    });
  }
};

export const listOfCategories = async (req, res) => {
  const { id } = req.user;
  const cacheKey = `categories:${id}`;
  const cacheResult = categoriesCache.get(cacheKey);
  if (cacheResult) {
    return res
      .status(200)
      .json({ success: true, data: { categories: cacheResult } });
  }

  try {
    let categories = await Links.distinct("category", {
      userId: id,
      isArchived: false,
    });

    categories = ["all", ...categories.filter((cat) => cat !== "all")];
    categoriesCache.set(cacheKey, categories);
    console.log(categories);
    return res.status(200).json({ success: true, data: { categories } });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch categories" });
  }
};
export const softDeletePile = async (req, res) => {
  try {
    const { id } = req.user;
    let { id: _id } = req.params;

    // Clear piles cache when items are archived
    const cacheKeys = pilesCache.keys();
    const userPileKeys = cacheKeys.filter((key) =>
      key.startsWith(`piles:${id}:`)
    );
    userPileKeys.forEach((key) => pilesCache.del(key));

    if (!_id) {
      return res
        .status(400)
        .json({ message: "Invalid Request, Id is required" });
    }

    // ✅ Add ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      console.log("something went wrong");
      return res;
    }

    let linkId = _id;
    if (!Array.isArray(linkId)) {
      linkId = [linkId];
    }

    // ✅ Now safe to create ObjectId
    const objectId = linkId.map((link) => {
      return new mongoose.Types.ObjectId(link);
    });

    const isArchivedCheck = await Links.find({ userId: id, _id: objectId })
      .select(["isArchived"])
      .lean();
    console.log(isArchivedCheck[0].isDeleted);
    if (isArchivedCheck[0].isDeleted) {
      return res.json({ message: "link already archievd" });
    }
    const updateResult = await Links.updateMany(
      { _id: { $in: objectId } },
      { $set: { isArchived: true } }
    );

    if (!updateResult) {
      return res.status(403).json({ message: "failed to archive" });
    }

    categoriesCache.del(`categories:${id}`);
    return res
      .status(200)
      .json({ message: `${updateResult.modifiedCount} links archived` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "an error has occurred" });
  }
};

export const archivedPile = async (req, res) => {
  const { id } = req.user;
  const { lastId, limit = 18 } = req.query;

  // ADD: Cache key for archived piles
  const cacheKey = `archived:${id}:${lastId || "first"}:${limit}`;
  const cachedResult = pilesCache.get(cacheKey);
  if (cachedResult) {
    return res.status(200).json({ success: true, data: cachedResult });
  }

  try {
    const query = { userId: id, isArchived: true };

    if (lastId && mongoose.Types.ObjectId.isValid(lastId)) {
      query._id = { $lt: new mongoose.Types.ObjectId(lastId) };
    }

    const archivedPiles = await Links.find(query)
      .select(["_id", "image", "url", "title", "description", "category"])
      .limit(Number(limit))
      .lean();

    const hasMore = archivedPiles.length === Number(limit);
    const newLastId =
      archivedPile.length > 0
        ? archivedPiles[archivedPiles.length - 1]._id
        : null;

    return res.status(200).json({
      success: true,
      message: "archivedPiles",
      data: { piles: archivedPiles, hasMore, newLastId },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "an error occured" });
  }
};

export const generatePublicLink = async (req, res) => {
  const { id } = req.user;

  // ADD: Clear existing public link cache
  const publicCacheKeys = publicLinkCache.keys();
  const userPublicKeys = publicCacheKeys.filter((key) => key.includes(id));
  userPublicKeys.forEach((key) => publicLinkCache.del(key));

  const { expiryOption = "2.5min" } = req.body;

  const now = Date.now();
  const expiryTimes = {
    "2.5min": 150 * 1000,
    "1hr": 60 * 60 * 1000,
    "24hr": 24 * 60 * 60 * 1000,
  };

  const expiresAt = now + (expiryTimes[expiryOption] || expiryTimes["2.5min"]);

  try {
    // Check for visible piles
    const visiblePiles = await Links.find({
      userId: id,
      visibility: true,
      isArchived: false,
    });

    if (visiblePiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Please make at least one pile public",
      });
    }

    // ALWAYS generate new token (remove the existing check completely)
    const publicLinkToken = nanoid(10);

    // Update all visible piles with new token and expiration
    await Links.updateMany(
      {
        userId: id,
        visibility: true,
        isArchived: false,
      },
      {
        $set: {
          publicLinkToken: publicLinkToken,
          expiresAt: new Date(expiresAt),
        },
      }
    );

    const environmentURL =
      process.env.NODE_ENV === "production"
        ? "https://api.supapile.com"
        : "http://localhost:2000";

    return res.status(200).json({
      success: true,
      data: `${environmentURL}/api/share/${publicLinkToken}`,
      expiresAt: expiresAt,
      expiryOption: expiryOption,
      visiblePilesCount: visiblePiles.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const userPublicLinkList = async (req, res) => {
  const { publicLinkToken } = req.params;

  const cacheKey = `public:${publicLinkToken}`;
  const cachedResult = publicLinkCache.get(cacheKey);
  if (cachedResult) {
    return res.status(200).json({
      success: true,
      data: cachedResult.data,
      expiresAt: cachedResult.expiresAt,
    });
  }

  try {
    const result = await Links.aggregate([
      {
        $match: {
          publicLinkToken: publicLinkToken,
          visibility: true,
          isArchived: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          url: 1,
          image: 1,
          title: 1,
          description: 1,
          name: "$user.name",
          _id: 0,
        },
      },
    ]);
    const Link = await Links.findOne({ publicLinkToken }).select([
      "-_id",
      "expiresAt",
    ]);

    if (!Link) {
      return res.status(404).json({ message: "Link not found" });
    }

    if (Link.expiresAt && new Date() > new Date(Link.expiresAt)) {
      return res.status(410).json({ message: "Link has expired" });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "404 not found" });
    }

    // ✅ Cache BEFORE returning
    const responseData = {
      data: result,
      expiresAt: Link?.expiresAt ?? null,
    };
    publicLinkCache.set(cacheKey, responseData, 60);

    return res.status(200).json({
      success: true,
      ...responseData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const restorePile = async (req, res) => {
  try {
    const { id } = req.user;

    // Clear piles cache when items are restored
    const cacheKeys = pilesCache.keys();
    const userPileKeys = cacheKeys.filter((key) =>
      key.startsWith(`piles:${id}:`)
    );
    userPileKeys.forEach((key) => pilesCache.del(key));

    let { id: _id } = req.params;
    console.log(_id);
    if (!_id) {
      return res
        .status(400)
        .json({ message: "Invalid Request, Id is required" });
    }
    // let linkId = _id;
    // const objectId = linkId.map((link) => {
    //   return new mongoose.Types.ObjectId(link);
    // });
    const result = await Links.updateOne(
      {
        userId: id,
        _id: _id,
        isArchived: true,
      },
      { $set: { isArchived: false } }
    );
    console.log(result);
    if (!result || result.modifiedCount <= 0) {
      return res.status(500).json({ message: "not restored" });
    }
    categoriesCache.del(`categories:${id}`);
    return res.status(200).json({ success: true, message: "pile restored" });
  } catch (error) {
    console.log(error);
  }
};

export const hardDeletePile = async (req, res) => {
  try {
    const { id } = req.user;

    // MISSING: Clear piles cache when items are permanently deleted
    const cacheKeys = pilesCache.keys();
    const userPileKeys = cacheKeys.filter((key) =>
      key.startsWith(`piles:${id}:`)
    );
    userPileKeys.forEach((key) => pilesCache.del(key));

    let { id: _id } = req.params;
    console.log("hey");
    console.log(_id);
    if (!_id) {
      return res
        .status(400)
        .json({ message: "Invalid Request, Id is required" });
    }
    let linkId = _id;
    if (!Array.isArray(linkId)) {
      linkId = [linkId];
    }
    const objectId = linkId.map((link) => {
      return new mongoose.Types.ObjectId(link);
    });
    const result = await Links.deleteOne({
      userId: id,
      _id: _id,
      isArchived: true,
    });
    console.log(result);
    if (!result || result.deletedCount <= 0) {
      return res.status(500).json({ message: "Pile not deleted" });
    }
    console.log(result);
    return res
      .status(200)
      .json({ success: true, message: "Pile permanetly deleted" });
  } catch (error) {
    console.log(error);
  }
};

export const changeCategory = async (req, res) => {
  try {
    const { id } = req.user;

    // Clear both categories and piles cache when categories change
    categoriesCache.del(`categories:${id}`);
    const cacheKeys = pilesCache.keys();
    const userPileKeys = cacheKeys.filter((key) =>
      key.startsWith(`piles:${id}:`)
    );
    userPileKeys.forEach((key) => pilesCache.del(key));

    const { id: _id } = req.params;
    const { category } = req.body;
    console.log(_id);
    console.log("hey");
    console.log(category);
    // if (Array.isArray(_id)) {
    //   throw new TypeError("Expected item to be an object.");
    // }
    const result = await Links.updateOne(
      { userId: id, _id },
      { $set: { category } }
    );
    console.log(result);
    if (!result || result.modifiedCount <= 0) {
      return res
        .status(500)
        .json({ success: false, message: "couldn't change category" });
    }
    return res.status(200).json({ success: true, data: "category changed" });
  } catch (error) {
    console.log(error);
    if (error instanceof TypeError) {
      return res.status(400).json({ error: "invalid input: " + error.message });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getClickedPile = async (req, res) => {
  const { id: userId } = req.user;
  const { id: _id } = req.params; // Extract 'id' from route params

  try {
    const result = await Links.find({
      userId,
      _id: new mongoose.Types.ObjectId(_id), // Convert to ObjectId
      // Remove category requirement or make it optional
    }).select([
      "_id",
      "url",
      "image",
      "title",
      "description",
      "visibility",
      "category",
    ]);

    console.log(result);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const changeVisibility = async (req, res) => {
  const { id } = req.user;

  // Clear piles cache when visibility changes
  const cacheKeys = pilesCache.keys();
  const userPileKeys = cacheKeys.filter((key) =>
    key.startsWith(`piles:${id}:`)
  );
  userPileKeys.forEach((key) => pilesCache.del(key));

  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res
      .status(400)
      .json({ success: false, message: "someting went wrong" });
  }
  try {
    const result = await Links.findOne({
      userId: id,
      _id: new mongoose.Types.ObjectId(_id),
    }).select("visibility");

    console.log(result.visibility);

    if (result?.visibility) {
      const result = await Links.updateOne(
        {
          userId: id,
          _id,
        },
        { $set: { visibility: false } }
      );
      return res.status(200).json({ success: true, data: "pile not visible" });
    }

    if (!result?.visibility) {
      const result = await Links.updateOne(
        {
          userId: id,
          _id,
        },
        { $set: { visibility: true } }
      );
      return res.status(200).json({ success: true, data: "pile visible" });
    }
  } catch (error) {
    console.log(error);
  }
};

export const getCurrentPublicLink = async (req, res) => {
  const { id } = req.user;
  const now = Date.now();

  // Add caching
  const cacheKey = `current-public:${id}`;
  const cachedResult = publicLinkCache.get(cacheKey);
  console.log("babies are trying to kill themselves all the time");
  console.log(cachedResult);
  if (cachedResult) {
    return res.status(200).json({ success: true, ...cachedResult });
  }

  try {
    const existing = await Links.findOne({
      userId: id,
      publicLinkToken: { $ne: "" },
      visibility: true,
      isArchived: false,
      expiresAt: { $gt: new Date(now) },
    });

    if (!existing || !existing.publicLinkToken) {
      return res.status(404).json({
        success: false,
        message: "No active public link found",
      });
    }

    const timeLeft = new Date(existing.expiresAt) - now;
    const minutesLeft = Math.floor(timeLeft / (1000 * 60));
    const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const responseData = {
      data: `http://localhost:2000/api/share/${existing.publicLinkToken}`,
      expiresAt: existing.expiresAt,
      timeLeft: {
        minutes: minutesLeft,
        seconds: secondsLeft,
        total: timeLeft,
      },
      message: `Link expires in ${minutesLeft}m ${secondsLeft}s`,
    };

    // Cache with shorter TTL since it has time-sensitive data
    publicLinkCache.set(cacheKey, responseData, 30);

    return res.status(200).json({ success: true, ...responseData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
