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
    
    console.log("\n--- SCRAPER DEBUG START ---");
    console.log("[A] Request Details");
    console.log(`- Exact Google search URL: ${url}`);
    console.log(`- Query string: ${query}`);
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };
    console.log(`- Headers being sent:`, JSON.stringify(headers, null, 2));

    const response = await axios.get(url, {
      headers: headers,
      timeout: 5000 // 5 seconds timeout
    });

    const data = response.data;
    const statusCode = response.status;

    console.log("\n[B] Raw Response");
    console.log(`- Response status code: ${statusCode}`);
    console.log(`- First 2000 chars of returned HTML:\n${String(data).substring(0, 2000)}`);

    console.log("\n[C] Detection Checks");
    const isCaptcha = data.includes('recaptcha') || data.includes('sorry/index');
    const isEmpty = !data || data.trim().length === 0;
    const isJsHeavy = data.includes('window.__DATA__') || data.includes('nonce=');
    console.log(`- Google CAPTCHA page returned: ${isCaptcha}`);
    console.log(`- Empty or blocked response: ${isEmpty}`);
    console.log(`- JS-heavy content instead of static HTML: ${isJsHeavy}`);

    const $ = cheerio.load(data);
    const snippets = [];
    const rawMatches = [];

    console.log("\n[D] Parsing Debug");
    const elements = $('.VwiC3b, .aCOpRe');
    console.log(`- Number of elements matched by selector (.VwiC3b, .aCOpRe): ${elements.length}`);

    // Google often changes its structure, but typical snippet classes are .VwiC3b, .yXK7lf
    // We will look for span or div elements containing text in search results
    elements.each((i, el) => {
      const rawText = $(el).text();
      rawMatches.push(rawText);
      const text = rawText.trim();
      if (text) {
        snippets.push(text);
      }
    });

    console.log(`- Extracted snippets BEFORE filtering:`, rawMatches);
    console.log(`- Final snippets array length: ${snippets.length}`);

    console.log("\n[STEP 3] Scraping Method");
    console.log(`- Library used: axios (HTTP client), cheerio (HTML parser)`);
    console.log(`- JS rendering supported: NO`);

    let failureReason = "None";
    if (snippets.length === 0) {
      console.log("\n[STEP 4] Fallback Debug Markers");
      if (elements.length === 0) {
        failureReason = "No elements matched the CSS selectors.";
      } else if (rawMatches.every(m => m.trim() === '')) {
        failureReason = "Elements matched but all text content was empty/whitespace.";
      } else {
        failureReason = "Filtering issue or unexpected HTML structure.";
      }
      console.log(`- WHY no snippets found: ${failureReason}`);
      console.warn("Scraping succeeded but no snippets found. Using fallback data.");
    }

    console.log("\nSCRAPER DEBUG SUMMARY:");
    console.log(`* Request URL: ${url}`);
    console.log(`* Status: ${statusCode}`);
    console.log(`* HTML type: ${isCaptcha ? 'CAPTCHA' : (isJsHeavy ? 'JS-heavy' : 'Standard Static HTML')}`);
    console.log(`* Selector matches: ${elements.length}`);
    console.log(`* Snippets extracted: ${snippets.length}`);
    console.log(`* Failure reason: ${failureReason}`);
    console.log("--- SCRAPER DEBUG END ---\n");

    if (snippets.length === 0) {
      return fallbackData;
    }

    return snippets;

  } catch (error) {
    console.error("\n--- SCRAPER DEBUG START (ERROR) ---");
    console.error("Scraping failed with error:", error.message);
    if (error.response) {
      console.error("- Response status:", error.response.status);
      console.error("- First 2000 chars of Error Response HTML:\n", String(error.response.data).substring(0, 2000));
    }
    
    console.log("\nSCRAPER DEBUG SUMMARY:");
    console.log(`* Request URL: https://www.google.com/search?q=${encodeURIComponent(query)}`);
    console.log(`* Status: ${error.response ? error.response.status : 'Network/Timeout Error'}`);
    console.log(`* HTML type: N/A`);
    console.log(`* Selector matches: 0`);
    console.log(`* Snippets extracted: 0`);
    console.log(`* Failure reason: ${error.message}`);
    console.log("--- SCRAPER DEBUG END ---\n");
    
    console.log("Using fallback LinkedIn sample posts to guarantee output.");
    return fallbackData;
  }
}
