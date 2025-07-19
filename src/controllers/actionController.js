import mongoose from "mongoose";
import Links from "../models/actionModel.js";
import { randomUUID } from "crypto";
import { generateMeta } from "../utilities/generateMeta.js";
import { generatePublicToken } from "../utilities/generateTokens.js";
import jwt from "jsonwebtoken";
export const postPile = async (req, res) => {
  try {
    let piles = req.body;
    const { id } = req.user;
    if (!Array.isArray(piles)) {
      piles = [piles];
    }
    let URLsToCheck = piles.map((pile) => pile.url);
    const existingPile = await Links.find({
      userId: id,
      url: { $in: URLsToCheck },
    });

    const existingURLs = existingPile.map((pile) => pile.url);
    const nonExistingURLs = await URLsToCheck.filter(
      (url) => !existingURLs.includes(url)
    );
    console.log("This exists" + existingURLs);
    const pilesToSend = piles.filter((pile) =>
      nonExistingURLs.includes(pile.url)
    );

    const formatedNonExistingURLs = pilesToSend.map((pileToSend) => ({
      userId: id,
      ...pileToSend,
    }));
    console.log(formatedNonExistingURLs);

    await Links.insertMany(formatedNonExistingURLs);

    if (existingURLs.length && existingURLs.isArchived) {
      return res.status(200).send({
        message: "pile exist but archived " + existingURLs,
      });
    }
    if (existingURLs.length && formatedNonExistingURLs.length) {
      return res.status(200).send({
        message:
          `saved: ` +
          "but pile with this URL not saved already exist: " +
          existingURLs,
      });
    }
    if (existingURLs.length) {
      return res.status(409).send({
        success: true,
        message: `${
          existingURLs.length > 1 ? "piles already exist" : "pile exists"
        }`,
      });
    }

    return res.status(200).send({
      success: true,
      message: `${
        formatedNonExistingURLs.length > 1 ? "piles saved" : "pile saved"
      }`,
    });
  } catch (error) {
    console.log(error);
  }
};

export const readPile = async (req, res) => {
  const { id } = req.user;
  const { category = "all" } = req.params;
  let { lastId, keyword, page = 1, limit = 18 } = req.query;

  const skip = (page - 1) * limit;

  try {
    let piles;
    let query = { userId: id, isArchived: false };

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
      .sort({ _id: 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const totalCount = await Links.countDocuments(query);
    const hasMore = skip + piles.length < totalCount;
    const results = piles.map((pile) => ({ id: pile._id, url: pile.url }));
    const notExistingMeta = await Links.find({
      userId: id,
      title: "",
      description: "",
    });

    console.log(notExistingMeta);
    const retrievedMeta = async (results) => {
      try {
        const metaResults = await Promise.all(
          results.map((result) => generateMeta(result))
        );
        console.log("jsjsjsj");
        console.log(metaResults);

        console.log("passed");
        const updates = await Promise.all(
          metaResults.map(async (metaResult) => {
            const updateResult = await Links.updateOne(
              { userId: id, _id: metaResult.id },
              {
                $set: {
                  image: metaResult.image,
                  title: metaResult.title,
                  description: metaResult.description,
                },
              }
            );

            console.log("this is the");
            console.log(updateResult);
            return updateResult;
          })
        );
      } catch (error) {
        console.log("Error during retrieval or update:", error);
      }
    };

    retrievedMeta(notExistingMeta);

    if (!piles || piles.length <= 0) {
      return res.json({ message: "doesn't exist" });
    }

    return res.status(200).json({ success: true, data: { piles, hasMore } });
  } catch (error) {
    console.log(error);
  }
};

export const listOfCategories = async (req, res) => {
  const { id } = req.user;
  try {
    let categories = await Links.distinct("category", {
      userId: id,
      isArchived: false,
    });
    categories = ["all", ...categories.filter((cat) => cat !== "all")];
    console.log(categories);
    return res.status(200).json({ sucess: true, data: { categories } });
  } catch (error) {
    console.log(error);
  }
};
export const softDeletePile = async (req, res) => {
  try {
    const { id } = req.user;
    let [{ _id }] = req.body;
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
    return res
      .status(200)
      .json({ message: `${updateResult.modifiedCount} links archived` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "an error has occurred" });
  }
};

export const archivedPile = async (req, res) => {
  try {
    const { id } = req.user;
    const archievdPiles = await Links.find({
      userId: id,
      isArchived: true,
    })
      .select(["id", "image", "url", "title", "description", "category"])
      .lean();
    return res
      .status(200)
      .json({ success: true, message: "archievedPiles", data: archievdPiles });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "an error occured" });
  }
};

export const generatePublicLink = async (req, res) => {
  try {
    const { id } = req.user;
    console.log(id);
    const randomuuID = randomUUID();
    const newLink = generatePublicToken(randomuuID);
    const result = await Links.updateMany(
      { userId: id, visibility: true },
      { $set: { publicLink: newLink } }
    );
    console.log("hehehehe");
    console.log(newLink); //i have to replace with an actual domain
    const link = `http://localhost:2000/api/share/${newLink}`;
    console.log(result);
    return res.status(200).json({ success: true, data: link });
  } catch (error) {
    console.log(error);
  }
};

export const userPublicLinkList = async (req, res) => {
  try {
    const { uuID } = req.params;
    const result = await Links.aggregate([
      {
        $match: {
          publicLink: uuID,
          visibility: true,
          isArchived: false,
        },
      },
      {
        $lookup: {
          from: "users", // must be the exact name of your collection in MongoDB (usually lowercase plural: 'users')
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user", // flattens the user array into an object
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

    console.log(result);
    const decoded = jwt.verify(uuID, process.env.JWT_SECRET);
    console.log(decoded);
    if (!result || result.length <= 0) {
      return res.status(404).json({ message: "404 not found" });
    }
    if (!decoded) {
      await Links.deleteMany({ publicLink: uuID });
      return res.status(200).json({ message: "nothing to see here" });
    }
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "nothing to see here" });
    }
    console.log(error);
  }
};

export const restorePile = async (req, res) => {
  try {
    const { id } = req.user;
    let { _id } = req.body;
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
    return res.status(200).json({ success: true, message: "pile restored" });
  } catch (error) {
    console.log(error);
  }
};

export const hardDeletePile = async (req, res) => {
  try {
    const { id } = req.user;
    let { _id } = req.body;
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
    const result2 = req.body;
    const { category, _id } = req.body;
    console.log(result2);
    console.log(_id);
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
  const { id } = req.user;
  console.log(id);
  const pile = req.body;
  console.log(pile);
  // console.log(pile)
  try {
    const result = await Links.find({
      userId: id,
      ...pile,
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
  }
};

export const changeVisibility = async (req, res) => {
  const { id } = req.user;
  const { _id } = req.body;
  console.log("heyehey");
  console.log(_id);

  if (!_id) {
    return res
      .status(404)
      .json({ success: false, message: "someting went wrong" });
  }
  try {
    const result = await Links.findOne({ userId: id, _id }).select(
      "visibility"
    );

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
