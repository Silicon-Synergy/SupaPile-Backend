const axios = require("axios");
const express = require("express");
const cheerio = require("cheerio");
const app = express();
const PORT = 3001;
app.get("/fetchMetaData", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send({ error: "A URL is required" });
  }
  try {
    // i want to make a request to that url
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const title = $("head title").text();
    const description = $('meta[name="description"]').attr("content");
    const image = $('meta[property="og:image"]').attr("content");
    res.json({
      title,
      description,
      image,
    });
  } catch (err) {
    res.status(500).send({ error: "failed to fetch URL" });
  }
});

app.listen(PORT, () => {
  console.log("Browser running on port 3001");
});
