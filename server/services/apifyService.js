import axios from 'axios';

const DEFAULT_ACTOR_ID = 'apimaestro~linkedin-posts-search-scraper-no-cookies';

function parseNumber(val) {
  if (val === undefined || val === null) return 0;
  const str = String(val).toLowerCase().replace(/,/g, '');

  if (str.endsWith('k')) return Math.round(parseFloat(str) * 1000);
  if (str.endsWith('m')) return Math.round(parseFloat(str) * 1000000);

  const parsed = parseInt(str.replace(/[^0-9]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

function cleanText(text) {
  return (text || '')
    .replace(/#\w+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePostData(item) {
  const stats = item.stats || {};

  return {
    text: cleanText(
      item.text ||
      item.content ||
      item.postContent ||
      item.description ||
      ''
    ),

    likes: parseNumber(
      stats.total_reactions ||
      stats.likes ||
      (Array.isArray(stats.reactions)
        ? stats.reactions.reduce((sum, r) => sum + (r.count || 0), 0)
        : 0)
    ),

    comments: parseNumber(
      stats.comments ??
      stats.numComments ??
      item.comments ??
      item.commentsCount ??
      0
    ),

    shares: parseNumber(
      stats.shares ??
      stats.reposts ??
      item.shares ??
      item.sharesCount ??
      0
    ),

    timestamp:
      item.posted_at ||
      item.timestamp ||
      item.postDate ||
      item.postedAt ||
      new Date().toISOString(),

    postUrl:
      item.post_url ||
      item.postUrl ||
      item.url ||
      item.linkedinUrl ||
      ''
  };
}

function toApifyDateFilter(timeRange) {
  if (timeRange === '24h') return 'past-24h';
  if (timeRange === '1w') return 'past-week';
  return 'past-week';
}

export async function fetchLinkedInPosts(queries, timeRange = '1w') {
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR_ID;

  if (!APIFY_API_TOKEN) {
    console.warn('[Apify] Missing API token.');
    return [];
  }

  const datePosted = toApifyDateFilter(timeRange);
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;

  const allPosts = [];

  console.log('\n================ APIFY DEBUG START ================');
  console.log('[Config]', { queries, timeRange, datePosted });

  for (const keyword of queries) {
    try {
      console.log(`\n[Apify] Fetching for: ${keyword}`);

      const response = await axios.post(
        url,
        {
          keyword,
          sortBy: 'date_posted',
          datePosted,
          maxResults: 25
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000
        }
      );

      const items = response.data || [];

      console.log(`[Apify] RAW items count: ${items.length}`);

      if (items.length > 0) {
        console.log('[Apify] RAW sample keys:', Object.keys(items[0]));
        console.log('[Apify] RAW sample stats:', items[0].stats);
      }

      if (!Array.isArray(items)) {
        console.warn('[Apify] Invalid response format');
        continue;
      }

      // Normalize
      const normalized = items.map(normalizePostData);

      console.log('[Normalize] Sample normalized post:', normalized[0]);

      let rejectedCount = 0;

      // Filter
      const filtered = normalized.filter((p, index) => {
        const text = (p.text || '').toLowerCase();

        let reason = null;

        if (
          text.includes('#hiring') ||
          text.includes('we are hiring') ||
          text.includes('apply now') ||
          text.includes('job')
        ) {
          reason = 'HIRING';
        }

        const engagement = (p.likes || 0) + (p.comments || 0);

        if (!reason && engagement < 10) {
          reason = 'LOW_ENGAGEMENT';
        }

        if (!reason && (!p.text || p.text.length < 80)) {
          reason = 'TOO_SHORT';
        }

        if (reason) {
          rejectedCount++;

          // Log only first few rejections to avoid spam
          if (rejectedCount <= 5) {
            console.log(`[FILTER REJECTED] Reason: ${reason}`);
            console.log({
              text: p.text?.slice(0, 100),
              likes: p.likes,
              comments: p.comments
            });
          }

          return false;
        }

        return true;
      });

      console.log(`[Filter] Accepted: ${filtered.length}, Rejected: ${rejectedCount}`);

      if (filtered.length > 0) {
        console.log('[Filter] Sample accepted post:', filtered[0]);
      }

      allPosts.push(...filtered);

    } catch (err) {
      console.error(`[Apify] Error for "${keyword}":`, err.message);
    }
  }

  // Deduplicate
  const seen = new Set();
  const unique = allPosts.filter((p) => {
    const key = p.postUrl || p.text.slice(0, 200);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Dedup] Before: ${allPosts.length}, After: ${unique.length}`);

  if (unique.length > 0) {
    console.log('[Final Output] Sample post:', unique[0]);
  }

  console.log('[Final Output] Total posts returned:', unique.length);
  console.log('================ APIFY DEBUG END ================\n');

  return unique;
}