import express from 'express';
import { getSerperFallback } from '../services/scraper.js';
import { generateHooksWithGroq } from '../services/groq.js';
import { fetchLinkedInPosts } from '../services/apifyService.js';
import { processViralPosts } from '../services/viralEngine.js';

const router = express.Router();

router.post('/generate-hooks', async (req, res) => {
  try {
    const { mode, niche, topic, goal, tone, timeRange = '1w' } = req.body;

    // 1. Build the search queries
    // IMPORTANT: Each query = 1 Apify actor run (costs credits).
    // We use a single combined keyword string to keep it to 1 run per click.
    let queries = [];
    if (mode === 'Pixii') {
      const base = [
        '"product page" ecommerce',
        '"amazon listing" optimization',
        '"bad product page"',
        '"improving product images"',
        '"why your ads dont convert"'
      ].join(' OR ');
      queries = [topic ? `${base} OR "${topic}"` : base];
    } else {
      queries = [niche || 'business growth'];
    }
    
    console.log(`[Cost Guard] Final query count: ${queries.length}`);
    if (queries.length > 1) {
      console.warn('[Cost Guard] Multiple queries detected. Limiting to 1 to control Apify cost.');
      queries = queries.slice(0, 1);
    }

    // 2. Fetch data from Apify (pass timeRange so actor uses LinkedIn's own date filter)
    let rawPosts = await fetchLinkedInPosts(queries, timeRange);
    let topPostsText = [];
    let patternsList = [];

    // 3. Process Virality (or fallback)
    if (rawPosts && rawPosts.length > 0) {
      const { topPosts, patterns } = processViralPosts(rawPosts, timeRange);
      topPostsText = topPosts.map(p => p.text);
      patternsList = patterns.examples ? [
        ...patterns.examples.contrarian,
        ...patterns.examples.painPoint,
        ...patterns.examples.curiosity,
        ...patterns.examples.numberLed
      ] : [];
    } else {
      console.warn("Apify returned no posts. Using fallback data.");
      topPostsText = getSerperFallback();
      patternsList = []; // No patterns extracted from fallback
    }

    // 4. Generate hooks via Groq
    const result = await generateHooksWithGroq({
      mode,
      niche,
      topic,
      goal,
      tone,
      topPosts: topPostsText,
      patterns: patternsList
    });

    res.json(result);
  } catch (error) {
    console.error("Error in /generate-hooks route:", error);
    res.status(500).json({ error: "Failed to generate hooks." });
  }
});

// Endpoint 3: /weekly-trigger (kept for manual testing)
router.post('/weekly-trigger', async (req, res) => {
  try {
    const defaultSettings = {
      mode: 'Pixii',
      goal: 'Get leads',
      tone: 'Contrarian'
    };

    // 2 queries for manual test to preserve Apify credits
    let rawPosts = await fetchLinkedInPosts(['ecommerce growth OR D2C growth', 'Amazon listings OR conversion optimization'], '1w');
    let topPostsText = [];
    let patternsList = [];

    if (rawPosts && rawPosts.length > 0) {
      const { topPosts, patterns } = processViralPosts(rawPosts, '1w');
      topPostsText = topPosts.map(p => p.text);
      patternsList = patterns.examples ? [
        ...patterns.examples.contrarian,
        ...patterns.examples.painPoint,
        ...patterns.examples.curiosity,
        ...patterns.examples.numberLed
      ] : [];
    } else {
      topPostsText = getSerperFallback();
    }

    const result = await generateHooksWithGroq({
      ...defaultSettings,
      topPosts: topPostsText,
      patterns: patternsList
    });

    res.json({ message: "Weekly automation triggered manually successfully", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to run weekly trigger" });
  }
});

export default router;
