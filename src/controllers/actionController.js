import Action from "../models/actionModel.js";

export const postLink = async (req, res) => {
  const { url, title, description } = req.body;
  const { _id } = req.user;

  const newUserAction = Action({
    userId: _id,
    url,
    title,
    description,
  });
  await newUserAction.save();
  if (newUserAction) {
    return res
      .status(401)
      .send({ message: "Couldn't save the link, try again later" });
  }
  return res.status(200).send({ success: true, message: "link saved" });
};
