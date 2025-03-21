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
