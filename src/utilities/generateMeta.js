import axios from "axios";
import * as Cheerio from "cheerio";

export const generateMeta = async (url) => {
  try {
    const decodedUrl = decodeURIComponent(url);
    const response = await axios.get(decodedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const $ = Cheerio.load(response.data);

    const title = $("head title").text();
    const description = $('meta[name="description"]').attr("content");
    const image = $('meta[property="og:image"]').attr("content");
    const result = { title, description, image };
    return result
  } catch (error) {
    console.error(error);
  }
};
