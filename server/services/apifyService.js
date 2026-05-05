import axios from 'axios';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USE_FIXTURES = process.env.USE_FIXTURES === 'true';
const DEFAULT_ACTOR_ID = 'apimaestro~linkedin-posts-search-scraper-no-cookies';

const parseNumber = (val) => {
  if (val === undefined || val === null) return 0;
  const str = String(val).toLowerCase().replace(/,/g, '');
  // Handle shorthand like "1.2k" or "3.5m"
  if (str.endsWith('k')) return Math.round(parseFloat(str) * 1000);
  if (str.endsWith('m')) return Math.round(parseFloat(str) * 1000000);
  const parsed = parseInt(str.replace(/[^0-9]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

const cleanText = (text) => {
  return (text || '')
    .replace(/#\w+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

function normalizePostData(item) {
  return {
    text: cleanText(item.text || item.content || item.postContent || item.description || ''),
    likes: parseNumber(
  stats.total_reactions ||
  stats.likes ||
  (Array.isArray(stats.reactions)
    ? stats.reactions.reduce((sum, r) => sum + (r.count || 0), 0)
    : 0)
),
    comments: parseNumber(item.stats?.comments ?? item.stats?.numComments ?? item.comments ?? item.commentsCount ?? 0),
    shares: parseNumber(item.stats?.shares ?? item.stats?.reposts ?? item.shares ?? item.sharesCount ?? 0),
    timestamp: item.posted_at || item.timestamp || item.postDate || item.postedAt || new Date().toISOString(),
    postUrl: item.post_url || item.postUrl || item.url || item.linkedinUrl || ''
  };
}

function toApifyDateFilter(timeRange) {
  if (timeRange === '24h') return 'past-24h';
  if (timeRange === '1w') return 'past-week';
  return 'past-week'; // safe default
}

/**
 * Runs one synchronous Apify actor call per keyword query.
 * Uses run-sync-get-dataset-items — starts the run AND returns results in one call.
 *
 * @param {string[]} queries - Array of keyword search strings
 * @param {string} timeRange - "24h" or "1w"
 * @returns {Promise<Array>} Normalized array of post objects
 */
export async function fetchLinkedInPosts(queries, timeRange = '1w') {
  // DEV MODE — no Apify calls, no credits spent
  if (USE_FIXTURES) {
    console.log('[Dev] USE_FIXTURES=true — reading server/fixtures/linkedinPosts.json');
    const raw = JSON.parse(
      readFileSync(join(__dirname, '../fixtures/linkedinPosts.json'), 'utf-8')
    );
    const mapped = raw.map(normalizePostData);
    console.log(`[Dev] Loaded ${mapped.length} fixture posts`);
    return mapped;
  }

  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR_ID;
  const datePosted = toApifyDateFilter(timeRange);

  if (!APIFY_API_TOKEN) {
    console.warn('[Apify] No APIFY_API_TOKEN provided. Cannot fetch live data.');
    return [];
  }

  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
  const allPosts = [];

  for (const keyword of queries) {
    const payload = {
      keyword,
      sortBy: 'date_posted',
      datePosted,
      maxResults: 25
    };

    try {
      console.log(`[Apify] Searching LinkedIn for: "${keyword}" (datePosted: ${datePosted})`);

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000 // 2 min — give the actor time to run
      });

      const items = response.data;
      if (items && items.length > 0) {
        console.log('[DEBUG] RAW FIRST ITEM:', JSON.stringify(items[0], null, 2));
      }

      if (!Array.isArray(items)) {
        console.warn(`[Apify] Non-array response for query "${keyword}":`, JSON.stringify(items).substring(0, 300));
        continue;
      }

      const isValidPost = (p) => {
      const text = (p.text || "").toLowerCase();

      if (
        text.includes("#hiring") ||
        text.includes("we are hiring") ||
        text.includes("apply now") ||
        text.includes("job") ||
        text.includes("join our team")
      ) return false;

      const engagement = (p.likes || 0) + (p.comments || 0);
      if (engagement < 20) return false;  

      const hasEnoughEnglish = (text) => {
      const letters = text.match(/[a-zA-Z]/g);
        return letters && letters.length > text.length * 0.5;
      };

      if (!hasEnoughEnglish(p.text)) return false;

      // Remove short content
      if (!p.text || p.text.length < 80) return false;

      return true;
    };

    const normalized = items.map(normalizePostData);
    const filtered = normalized.filter(isValidPost);
    const rejected = normalized.filter(p => !isValidPost(p));

    console.log(`[FILTER] Rejected sample:`, rejected.slice(0, 2)); 

    console.log('\n========== FILTER DEBUG ==========');
    console.log(`[FILTER] Before: ${normalized.length}`);
    console.log(`[FILTER] After: ${filtered.length}`);

    if (filtered.length > 0) {
      console.log('[FILTER] Sample kept:', filtered[0]);
    } else {
      console.log('[FILTER] No posts survived filtering');
    }

    console.log('=================================\n');

    if (normalized.length > 0) {
      console.log('\n========== NORMALIZED DATA ==========');
      console.log('[NORMALIZED] First post:', normalized[0]);
      console.log('====================================\n');
    }

      console.log(`[Apify] "${keyword}" → ${normalized.length} posts fetched`);

      // Debug: print first item's raw fields so you can verify the schema
      if (items.length > 0) {
        console.log(`[Apify] Sample raw fields from first item:`, JSON.stringify(Object.keys(items[0])));
        console.log(`[Apify] Sample normalized post:`, JSON.stringify(normalized[0], null, 2));
      }

      allPosts.push(...filtered);

      // Small pause between queries to be a good API citizen
      await new Promise(r => setTimeout(r, 300));

    } catch (error) {
      console.error(`[Apify] Failed for query "${keyword}":`, error.message);
      if (error.response) {
        console.error('[Apify] Response data:', JSON.stringify(error.response.data));
      }
      // Continue with next query rather than aborting everything
    }
  }

  const seen = new Set();
  const unique = allPosts.filter(p => {
    // const key = p.postUrl || p.text.substring(0, 100);
    const key = p.postUrl || p.text.slice(0, 200).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Apify] Total unique posts fetched: ${unique.length}`);
  return unique;
}
