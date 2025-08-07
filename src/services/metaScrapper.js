import * as Cheerio from "cheerio";
import axios from "axios";
import { generateMeta } from "../utilities/generateMeta.js";
export const  metaScrapper = async (req, res) => {
  try {
    const { url } = req.query;
    const result = await generateMeta({url}) 
    console.log(result)
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return new Error("failed to fetchMeta data");
  }
};
