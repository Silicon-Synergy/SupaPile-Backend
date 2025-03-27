import mongoose from "mongoose";
import Links from "../models/actionModel.js";

export const postPile = async (req, res) => {
  let piles = req.body;
  const { id } = req.user;
  if (!Array.isArray(piles)) {
    piles = [piles];
  }

  let URLsToCheck = piles.map((pile) => pile.url);

  try {
    const existingPile = await Links.find({
      userId: id,
      url: { $in: URLsToCheck },
    });
    const existingURLs = existingPile.map((pile) => pile.url);
    const nonExistingURLs = await URLsToCheck.filter(
      (url) => !existingURLs.includes(url)
    );
    const pilesToSend = piles.filter((pile) =>
      nonExistingURLs.includes(pile.url)
    );

    const formatedNonExistingURLs = pilesToSend.map((pileToSend) => ({
      userId: id,
      ...pileToSend,
    }));
    console.log(formatedNonExistingURLs);

    await Links.insertMany(formatedNonExistingURLs);

    if (existingURLs.length && formatedNonExistingURLs.length) {
      return res.status(200).send({
        success: true,
        message:
          `saved: ` +
          "but pile with with this URL not saved already exist: " +
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

  let { lastId } = req.query;
  let limit = 48;
  //the endpoint needs to accept a last id if it not proivded only give me the first id
  console.log(id);
  try {
    const piles = await Links.find({
      userId: id,
      isDeleted: false,
      ...(lastId && { _id: { $gt: lastId } }),
    })
      .select(["userId", "title", "description", "_id"])
      .sort({ _id: 1 })
      .limit(limit)
      .lean();
    // lean is used to optimize the mongodb return since i
    // am not performing any extra action on the object
    // learn makes sure its a javascript object that is returned
    // not a mongoose object
    if (!piles) {
      return res.json({ message: "no piles yet" });
    }
    return res.status(200).json({ success: true, message: piles });
  } catch (error) {
    console.log(error);
  }
};

export const softDeletePile = async (req, res) => {
  const { id } = req.user;
  try {
    let [{ _id }] = req.body;
    if (!_id) {
      return res
        .status(400)
        .json({ message: "Ivalid Request, Id is required" });
    }
    let linkId = _id;
    if (!Array.isArray(linkId)) {
      linkId = [linkId];
    }
    const objectId = linkId.map((link) => {
      return new mongoose.Types.ObjectId(link);
    });
    const isDeletedCheck = await Links.find({ userId: id, _id: objectId })
      .select(["isDeleted"])
      .lean();
    console.log(isDeletedCheck[0].isDeleted);
    if (isDeletedCheck[0].isDeleted) {
      return res.json({ message: "link already archievd" });
    }
    const updateResult = await Links.updateMany(
      { _id: { $in: objectId } },
      { $set: { isDeleted: true } }
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
  const { id } = req.user;
  try {
    const archievdPiles = await Links.find({
      userId: id,
      isDeleted: true,
    }).lean();
    return res
      .status(500)
      .json({ success: true, message: "archievedPiles", archievdPiles });
  } catch (error) {
    console.log(error);
    return res.staus(500).json({ message: "an error occured" });
  }
};

export const restorePile= async (req, res) => {};
export const hardDeletePile = async (req, res) => {};

