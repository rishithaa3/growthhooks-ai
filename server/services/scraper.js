import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Fallback LinkedIn-style posts if scraping fails
 */
const fallbackData = [
  "Ecommerce growth is a myth if your conversion rate is under 2%. Stop buying traffic. Fix your funnel first.",
  "Most D2C brands spend 80% on ads and 20% on content. Flip that. Content drives revenue, ads just amplify it. Here's why...",
  "Stop trying to hack the algorithm. AI marketing is about scaling personalization. If your audience doesn't feel understood, they won't buy.",
  "The biggest mistake I see ecommerce founders make? Focusing on Top of Funnel (ToF) when their Bottom of Funnel (BoF) leaks like a sieve.",
  "Why your SaaS marketing isn't working: You're selling features instead of the new reality your product creates for the user."
];

/**
 * Attempts to scrape Google Search results for LinkedIn posts related to the query
 * @param {string} query
 * @returns {Promise<string[]>} Array of text snippets
 */
export async function scrapeGoogleSearch(query) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 5000 // 5 seconds timeout
    });

    const $ = cheerio.load(data);
    const snippets = [];

    // Google often changes its structure, but typical snippet classes are .VwiC3b, .yXK7lf
    // We will look for span or div elements containing text in search results
    $('.VwiC3b, .aCOpRe').each((i, el) => {
      const text = $(el).text().trim();
      if (text) {
        snippets.push(text);
      }
    });

    if (snippets.length === 0) {
      console.warn("Scraping succeeded but no snippets found. Using fallback data.");
      return fallbackData;
    }

    return snippets;

  } catch (error) {
    console.error("Scraping failed:", error.message);
    console.log("Using fallback LinkedIn sample posts to guarantee output.");
    return fallbackData;
  }
}
