import mongoose from "mongoose";
import Links from "../models/actionModel.js";

export const postLink = async (req, res) => {
  const { url, title, description } = req.body;
  let links = req.body;
  const { id } = req.user;

  if (!Array.isArray(links)) {
    links = [links];
  }

  const existingUrl = await Links.findOne(req.body.url);

  console.log(existingUrl);

  if (existingUrl) {
    return res.status(404).json({ message: "Link already exists" });
  }
  try {
    const newUserAction = links.map((link) => ({
      userId: id,
      ...link,
    }));

    console.log(url);
    console.log(newUserAction);
    await Links.insertMany(newUserAction);

    if (!newUserAction) {
      return res
        .status(401)
        .send({ message: "Couldn't save the link, try again later" });
    }
    return res.status(200).send({
      success: true,
      message: `${links.length > 1 ? "links saved" : "link saved"}`,
    });
  } catch (error) {
    console.log(error);
  }
};

export const readLink = async (req, res) => {
  let userId = req.user.id;
  //the endpoint needs to accept a last id if it not proivded only give me the first 10
  console.log(userId);
  try {
    const links = await Links.find({ userId: userId, isDeleted: false })
      .select(["userId", "title", "description", "_id"])
      .lean();
    // lean is used to optimize the mongodb return since i
    // am not performing any extra action on the object
    // learn makes sure its a javascript object that is returned
    // not a mongoose object
    if (!links) {
      return res.json({ message: "no links yet" });
    }
    return res.status(200).json({ success: true, message: links });
  } catch (error) {
    console.log(error);
  }
};

export const softDeleteLink = async (req, res) => {
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
    const isDeletedCheck = await Links.find({ _id: objectId })
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

export const archived = async (req, res) => {
  try {
    const archievdLinks = await Links.find({ isDeleted: true }).lean();
    return res
      .status(500)
      .json({ success: true, message: "archievedLinks", archievdLinks });
  } catch (error) {
    console.log(error);
    return res.staus(500).json({ message: "an error occured" });
  }
};

export const restoreLink = async (req, res) => {};
export const hardDeleteLink = async (req, res) => {};
