import * as Cheerio from "cheerio";
import axios from "axios";
import { generateMeta } from "../utilities/generateMeta.js";

// URL validation function
const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS protocol
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }
    
    // Block localhost and private IP ranges
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Block localhost variations
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname)) {
      return false;
    }
    
    // Block private IP ranges (RFC 1918)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);
      
      // Block private ranges
      if (
        (a === 10) || // 10.0.0.0/8
        (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
        (a === 192 && b === 168) || // 192.168.0.0/16
        (a === 169 && b === 254) || // Link-local 169.254.0.0/16
        (a >= 224) // Multicast and reserved
      ) {
        return false;
      }
    }
    
    // Block common cloud metadata endpoints
    const blockedHosts = [
      'metadata.google.internal',
      '169.254.169.254', // AWS/Azure metadata
      'metadata.azure.com',
      'metadata.packet.net'
    ];
    
    if (blockedHosts.includes(hostname)) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

export const metaScrapper = async (req, res) => {
  try {
    const { url } = req.query;
    
    // Validate URL parameter exists
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: "URL parameter is required" 
      });
    }
    
    // Validate URL format and security
    if (!isValidUrl(url)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or blocked URL. Only HTTPS URLs are allowed." 
      });
    }
    
    const result = await generateMeta({url});
    console.log(result);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Meta scrapper error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch meta data" 
    });
  }
};
