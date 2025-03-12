const axios = require("axios");
const cheerio = require("cheerio");

const fetchMetaData = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    console.log(response);
    const title = $("head title").text();
    const description = $('meta[name="description"]').attr("content");
    const image = $('meta[property="og:image"]').attr("content");

    return {
      title,
      description,
      image,
    };
  } catch (err) {
    throw new err("failed to fetchMeta data");
  }
};

//i exported this to the scrapper service for use
module.exports = { fetchMetaData };
