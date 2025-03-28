import { Cheerio } from "cheerio";
import axios from "axios";
export const metaScrapper = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = Cheerio.load(response.data);
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