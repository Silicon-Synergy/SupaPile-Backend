import axios from "axios";
import * as Cheerio from "cheerio";
import { metaCache } from "../cache/cache-with-nodeCache.js";

export const generateMeta = async (theObject) => {
  const decodedUrl = decodeURIComponent(theObject.url);
  const cacheKey = `meta:${decodedUrl}`;
  const cacheResult = metaCache.get(cacheKey);

  if (cacheResult) {
    return { ...cacheResult, id: theObject.id };
  }

  // fallback to Cheerio scraping
  const domain1 = new URL(decodedUrl).hostname.split(".")[0];
  const domain2 = new URL(decodedUrl).hostname;
  try {
    const hostname = new URL(decodedUrl).hostname;
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      // 🎯 YouTube: use oEmbed
      const oEmbedUrl = `https://www.youtube.com/oembed?url=${decodedUrl}&format=json`;
      const response = await axios.get(oEmbedUrl);

      const metaData = {
        title: response.data.title,
        description: response.data.author_name,
        image: response.data.thumbnail_url,
      };

      const result = { ...metaData, id: theObject.id };
      metaCache.set(cacheKey, result);
      return result;
    } else {
      // 🌍 Any other website: use your existing Cheerio scraping
      const response = await axios.get(decodedUrl, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      const $ = Cheerio.load(response.data);
      let title = $("head title").text();
      let description =
        $('meta[name="description"]').attr("content") || `from ${hostname}`;
      const image = $('meta[property="og:image"]').attr("content");

      if (!title || !description) {
        title = hostname.split(".")[0];
        description = hostname;
      }

      const metaData = { title, description, image };
      const result = { ...metaData, id: theObject.id };
      metaCache.set(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.log("meta fetch failed", error.message);
    const fallback = {
      title: domain1,
      description: `from ${domain2}`,
      image: "",
    };
    const result = { ...fallback, id: theObject.id };
    metaCache.set(cacheKey, result, 3600);
    return result;
  }
};
