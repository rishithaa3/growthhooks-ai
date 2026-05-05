import express from 'express';
import { generateHooksWithGroq } from '../services/groq.js';
import { fetchLinkedInPosts } from '../services/apifyService.js';
import { computeVirality, filterByTime, processViralPosts } from '../services/viralEngine.js';
import { saveHooks } from '../services/dbService.js';
import { supabase } from '../services/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fixturePosts = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/linkedinPosts.json'), 'utf-8')
);

const router = express.Router();
const USE_FIXTURES = process.env.USE_FIXTURES === 'true';

function getPatternExamples(patterns) {
  return patterns.examples ? [
    ...patterns.examples.contrarian,
    ...patterns.examples.painPoint,
    ...patterns.examples.curiosity,
    ...patterns.examples.numberLed
  ] : [];
}

function buildQueries({ instructions }) {
  const base = [
    '"product page" ecommerce',
    '"amazon listing" optimization',
    '"bad product page"',
    '"improving product images"',
    '"why your ads dont convert"'
  ].join(' OR ');

  return [instructions ? `${base} OR "${instructions}"` : base];
}

async function getPosts({ queries, timeRange }) {
  if (USE_FIXTURES) {
    console.log('[Data Source] Using fixture data');
    return fixturePosts;
  }

  console.log('[Data Source] Using Apify');
  return await fetchLinkedInPosts(queries, timeRange);
}

router.post('/generate-hooks', async (req, res) => {
  try {
    const { instructions, goal, tone, timeRange = '1w' } = req.body;

    let queries = buildQueries({ instructions });

    console.log(`[Cost Guard] Final query count: ${queries.length}`);
    if (queries.length > 1) {
      queries = queries.slice(0, 1);
    }

    const rawPosts = await getPosts({ queries, timeRange });

    // const filteredPosts = filterByTime(rawPosts, timeRange);
    // const scoredPosts = computeVirality(filteredPosts);

    // const { topPosts, patterns } = processViralPosts(scoredPosts, timeRange);
    const { topPosts, patterns, totalProcessed } = processViralPosts(rawPosts, timeRange);


    const stats = {
      totalAnalyzed: rawPosts.length,
      selected: topPosts.length
    };

    const topPostsText = topPosts.map(p => p.text);
    const patternsList = getPatternExamples(patterns);

    const result = await generateHooksWithGroq({
      instructions,
      goal,
      tone,
      topPosts: topPostsText,
      patterns: patternsList
    });

    // 🔥 IMPORTANT: capture returned rows with IDs
    const savedRows = await saveHooks({
      hooks: result.hooks,
      explanations: result.explanations,
      trends: result.trend_insights,
      source: USE_FIXTURES ? 'fixture' : 'apify',
      instructions,
      goal,
      tone
    });

    // 🔥 MAP hooks with DB IDs
    const hooksWithIds = result.hooks.map((hook, i) => ({
      hook,
      id: savedRows?.[i]?.id || null
    }));

    console.log('RAW POSTS COUNT:', rawPosts.length);
    // console.log('AFTER TIME FILTER:', filteredPosts.length);
    // console.log('AFTER SCORING:', scoredPosts.length);

    console.log('TOP POSTS:', topPosts.length);

    res.json({
      hooks: hooksWithIds,
      explanations: result.explanations,
      trends: result.trend_insights,
      stats // 🔥 NEW
    });
    

  } catch (error) {
    console.error("Error in /generate-hooks route:", error);
    res.status(500).json({ error: "Failed to generate hooks." });
  }
});

router.post('/weekly-trigger', async (req, res) => {
  try {
    const defaultSettings = {
      goal: 'Get leads',
      tone: 'Contrarian',
      instructions: ''
    };

    let queries = buildQueries(defaultSettings);

    const rawPosts = await getPosts({ queries, timeRange: '1w' });

    // const filteredPosts = filterByTime(rawPosts, '1w');
    // const scoredPosts = computeVirality(filteredPosts);

    // const { topPosts, patterns } = processViralPosts(scoredPosts, '1w');
    const { topPosts, patterns, totalProcessed } = processViralPosts(rawPosts, timeRange);


    const stats = {
      totalAnalyzed: rawPosts.length,
      selected: topPosts.length
    };

    const topPostsText = topPosts.map(p => p.text);
    const patternsList = getPatternExamples(patterns);

    const result = await generateHooksWithGroq({
      ...defaultSettings,
      topPosts: topPostsText,
      patterns: patternsList
    });

    await saveHooks({
      hooks: result.hooks,
      explanations: result.explanations,
      trends: result.trend_insights,
      source: USE_FIXTURES ? 'fixture' : 'apify',
      instructions: '',
      goal: defaultSettings.goal,
      tone: defaultSettings.tone
    });

    res.json({ message: "Weekly automation triggered successfully", result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to run weekly trigger" });
  }
});

router.post('/improve-hook', async (req, res) => {
  try {
    const { hook, instruction, tone, id } = req.body;

    const result = await generateHooksWithGroq({
      instructions: `Improve this hook based on instruction: "${instruction}". Original hook: "${hook}"`,
      goal: 'Improve hook',
      tone: tone || 'Contrarian',
      topPosts: [],
      patterns: []
    });

    const improvedHook = result.hooks?.[0] || hook;

    // 🔥 UPDATE SAME ROW
    if (id) {
      await supabase
        .from('hooks_library')
        .update({ hook: improvedHook })
        .eq('id', id);
    }

    res.json({
      improvedHook
    });

  } catch (error) {
    console.error('[Improve Hook Error]', error);
    res.status(500).json({ error: 'Failed to improve hook' });
  }
});

export default router;