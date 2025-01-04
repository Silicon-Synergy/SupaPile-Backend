const axios = require("axios");
const express = require("express");
const cheerio = require("cheerio");
const app = express();
const cors = require("cors");
const PORT = 4501;

app.use(cors());

app.get("/fetchMetaData", async (req, res) => {
  const { url } = req.query;
  

  if (!url) {
    return res.status(400).send({ error: "A URL is required" });
  }

  axios
    .get(url)
    .then((response) => {
      const $ = cheerio.load(response.data);
      console.log(response);
      const title = $("head title").text();
      const description = $('meta[name="description"]').attr("content");
      const image = $('meta[property="og:image"]').attr("content");
      res.json({
        title,
        description,
        image,
      });
    })
    .catch((error) => {
      res.status(500).send({ error: "failed to fetch URL" });
    });
  // try {
  //   const { data } = await axios.get(url);
  //   const $ = cheerio.load(data);
  //   const title = $("head title").text();
  //   const description = $('meta[name="description"]').attr("content");
  //   const image = $('meta[property="og:image"]').attr("content");
  //   res.json({
  //     title,
  //     description,
  //     image,
  //   });
  // } catch (err) {
  //   res.status(500).send({ error: "failed to fetch URL" });
  // }
});

app.listen(PORT, () => {
  console.log(`Browser running on port ${PORT} `);
});
