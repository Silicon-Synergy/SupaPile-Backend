import axios from "axios";
import * as Cheerio from "cheerio";

export const generateMeta = async (theObject) => {
  const decodedUrl = decodeURIComponent(theObject.url);
  const domain1 = new URL(decodedUrl).hostname.split(".")[0];
  const domain2 = new URL(decodedUrl).hostname;
  try {
    const response = await axios.get(decodedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    // https://chatgpt.com/c/67fbbbeb-0018-800d-a665-2dff1a4c60d8
    const $ = Cheerio.load(response.data);

    // console.log(domain);
    // console.log("jhey")
    const title = $("head title").text();
    let description =
      $('meta[name="description"]').attr("content") || `from ${domain2}`;
    const image = $('meta[property="og:image"]').attr("content");
    const result = { title, description, image, id: theObject.id };
    console.log(description);
    console.log("hi i am Ayotide");
    return result;
  } catch (error) {
    console.log(decodedUrl);
    const result = {
      title: domain1,
      description: `from ${domain2}`,
      image: "",
      id: theObject.id,
    };
    return result;
  }
};
