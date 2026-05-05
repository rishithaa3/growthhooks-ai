import axios from 'axios';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const SERPER_URL = 'https://google.serper.dev/search';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USE_FIXTURES = process.env.USE_FIXTURES === 'true';

const fallbackData = [
  "Ecommerce growth is a myth if your conversion rate is under 2%. Stop buying traffic. Fix your funnel first.",
  "Most D2C brands spend 80% on ads and 20% on content. Flip that. Content drives revenue, ads just amplify it.",
  "Stop trying to hack the algorithm. AI marketing is about scaling personalization.",
  "The biggest mistake I see ecommerce founders make? Focusing on ToF when their BoF leaks like a sieve.",
  "Why your SaaS marketing isn't working: You're selling features instead of the new reality your product creates."
];

const LINKEDIN_NOISE = [
  /view (organization|company|linkedin) page for .+?(\.|$)/gi,
  /\d+[kKmM]?\s*followers?/gi,
  /\d+[smhdw]\b/gi,           // timestamps: 5d, 2h, 30m
  /report this post/gi,
  /like\s*comment\s*share/gi,
  /\d+ reactions?/gi,
  /\d+ comments?/gi,
  /^\s*(repost|share|like)\s*$/gim,
];

function cleanSnippet(raw) {
  let text = raw;
  for (const pattern of LINKEDIN_NOISE) {
    text = text.replace(pattern, '');
  }
  text = text.replace(/\s{2,}/g, ' ').trim();
  
  // Extract only the first 1-2 sentences which typically contain the hook
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 2).join(' ').trim();
}

const HOOK_QUERIES = [
  // Contrarian openers (high viral signal)
  'site:linkedin.com/posts "stop doing" ecommerce',
  'site:linkedin.com/posts "unpopular opinion" marketing',
  'site:linkedin.com/posts "nobody talks about" ecommerce',
  'site:linkedin.com/posts "harsh truth" marketing',

  // Number-led hooks
  'site:linkedin.com/posts "I went from" ecommerce revenue',
  'site:linkedin.com/posts "$0 to $" marketing',
  'site:linkedin.com/posts "in 90 days" ecommerce',
  'site:linkedin.com/posts "10x" ROI marketing',

  // Question hooks
  'site:linkedin.com/posts "why is nobody" ecommerce',
  'site:linkedin.com/posts "what happens when" AI marketing',
  'site:linkedin.com/posts "are you still" ecommerce',
  'site:linkedin.com/posts "how did we" scale marketing',

  // Story hooks
  'site:linkedin.com/posts "3 years ago" ecommerce founder',
  'site:linkedin.com/posts "I almost quit" ecommerce',
  'site:linkedin.com/posts "the hardest lesson" marketing',
  'site:linkedin.com/posts "when I started" agency'
];

// === SERPER API SCRAPING (DISABLED AS PRIMARY, KEPT AS SECONDARY FALLBACK) ===
/*
export async function scrapeGoogleSearch(query) {
  const SERPER_API_KEY = process.env.SERPER_API_KEY;

  if (!SERPER_API_KEY) {
    console.warn('[Serper] No API key found. Using fallback data.');
    return fallbackData;
  }

  try {
    console.log(`\n--- SERPER API DEBUG START ---`);
    console.log(`[Serper] Searching: ${query}`);
    console.log(`[Serper] Request URL: ${SERPER_URL}`);
    
    const requestBody = { q: query, num: 20 };
    console.log(`[Serper] Request Body:`, JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      SERPER_URL,
      requestBody,
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    console.log(`[Serper] Response Status: ${response.status}`);
    const results = response.data?.organic ?? [];

    if (results.length === 0) {
      console.warn('[Serper] No organic results returned. Using fallback.');
      console.log(`[Serper] Full Response Data:`, JSON.stringify(response.data).substring(0, 500) + '...');
      console.log(`--- SERPER API DEBUG END ---\n`);
      return fallbackData;
    }

    const rawSnippets = results.map(r => r.snippet).filter(Boolean);
    const cleanedSnippets = rawSnippets
      .map(s => cleanSnippet(s))
      .filter(s => s.length > 60); // drop anything too short to be a real post

    const dropped = rawSnippets.length - cleanedSnippets.length;

    if (cleanedSnippets.length > 0) {
      console.log(`[Serper] First snippet example: "${cleanedSnippets[0]}"`);
    }
    console.log(`[Serper] Cleaned: ${cleanedSnippets.length} snippets kept, ${dropped} dropped as noise`);
    console.log(`--- SERPER API DEBUG END ---\n`);
    
    return cleanedSnippets.length > 0 ? cleanedSnippets : fallbackData;

  } catch (error) {
    console.error(`\n--- SERPER API DEBUG START (ERROR) ---`);
    console.error('[Serper] Request failed:', error.message);
    if (error.response) {
      console.error('[Serper] Error Response Status:', error.response.status);
      console.error('[Serper] Error Response Data:', JSON.stringify(error.response.data));
    }
    console.log(`--- SERPER API DEBUG END ---\n`);
    return fallbackData;
  }
}

export async function batchScrape() {
  console.log(`[Serper Batch] Starting batch scrape for ${HOOK_QUERIES.length} queries...`);
  const allSnippets = [];
  
  for (let i = 0; i < HOOK_QUERIES.length; i++) {
    const query = HOOK_QUERIES[i];
    console.log(`[Serper Batch] Executing query ${i + 1}/${HOOK_QUERIES.length}`);
    const snippets = await scrapeGoogleSearch(query);
    
    // Ignore fallback data from individual failed calls to prevent multiplication of fallback
    if (snippets !== fallbackData) {
      allSnippets.push(...snippets);
    }
    
    // Wait 200ms between calls to avoid rate limits, unless it's the last query
    if (i < HOOK_QUERIES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Deduplicate by exact string match
  const uniqueSnippets = [...new Set(allSnippets)];
  console.log(`[Serper Batch] Completed. Total unique snippets gathered: ${uniqueSnippets.length}`);
  
  if (uniqueSnippets.length > 0) {
    console.log(`\n=== EXTRACTED HOOKS FED TO AI ===`);
    uniqueSnippets.forEach((snippet, idx) => {
      console.log(`[Hook ${idx + 1}] ${snippet}`);
    });
    console.log(`=================================\n`);
  }
  
  return uniqueSnippets.length > 0 ? uniqueSnippets : fallbackData;
}
*/

// Export fallback explicitly for any remaining dependencies during transition
export const getSerperFallback = () => fallbackData;

export async function scrapeLinkedInPosts(keyword, timeRange = '7d') {

  // DEV MODE — return fixture data instantly, no API call
  if (USE_FIXTURES) {
    console.log(`[Dev] USE_FIXTURES=true — skipping Apify for "${keyword}"`);
    const raw = JSON.parse(
      readFileSync(join(__dirname, 'fixtures/linkedinPosts.json'), 'utf-8')
    );
    return raw.map(item => ({
      hook:          extractHook(item.text),
      reactionCount: item.stats?.likes ?? 0,
      commentCount:  item.stats?.comments ?? 0,
      postedAt:      item.posted_at,
      author:        item.author?.name ?? 'Unknown',
      url:           item.post_url ?? null,
    })).filter(p => p.hook && p.hook.length > 25);
  }

  // PRODUCTION — real Apify call
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  if (!APIFY_API_TOKEN) {
    console.warn('[Apify] No API token. Skipping.');
    return [];
  }

  const datePosted = timeRange === '24h' ? 'past-24h' : 'past-week';

  try {
    const response = await axios.post(
      APIFY_SYNC_URL,
      { keyword, sortBy: 'date_posted', datePosted, maxResults: 20 },
      {
        params: { token: APIFY_API_TOKEN },
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000
      }
    );

    const items = response.data ?? [];

    return items
      .filter(item => (item.stats?.likes ?? item.stats?.numLikes ?? 0) >= 100)
      .map(item => {
        const hook = extractHook(item.text);
        if (!hook || hook.length < 25) return null;
        return {
          hook,
          reactionCount: item.stats?.likes   ?? item.stats?.numLikes   ?? 0,
          commentCount:  item.stats?.comments ?? item.stats?.numComments ?? 0,
          postedAt:      item.posted_at ?? item.postedAt ?? null,
          author:        item.author?.name ?? item.author?.fullName ?? 'Unknown',
          url:           item.post_url ?? null,
        };
      })
      .filter(Boolean);

  } catch (err) {
    console.error(`[Apify] Failed for "${keyword}":`, err.message);
    return [];
  }
}