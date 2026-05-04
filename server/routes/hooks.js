import express from 'express';
import { scrapeGoogleSearch } from '../services/scraper.js';
import { generateHooksWithGemini } from '../services/gemini.js';

const router = express.Router();

router.post('/generate-hooks', async (req, res) => {
  try {
    const { mode, niche, topic, goal, tone } = req.body;

    // Build the search query
    let searchQuery = "site:linkedin.com/posts ";
    if (mode === 'Pixii') {
      searchQuery += `"ecommerce growth" OR "AI marketing"`;
      if (topic) searchQuery += ` "${topic}"`;
    } else {
      searchQuery += `"${niche || 'business growth'}"`;
    }

    // 1. Scrape data (or get fallback)
    const snippets = await scrapeGoogleSearch(searchQuery);

    // 2. Generate hooks via Gemini
    const result = await generateHooksWithGemini({
      mode,
      niche,
      topic,
      goal,
      tone,
      snippets
    });

    res.json(result);
  } catch (error) {
    console.error("Error in /generate-hooks route:", error);
    res.status(500).json({ error: "Failed to generate hooks." });
  }
});

// Endpoint 3: /weekly-trigger
router.post('/weekly-trigger', async (req, res) => {
  // Simulates weekly automation
  try {
    const defaultSettings = {
      mode: 'Pixii',
      goal: 'Get leads',
      tone: 'Contrarian'
    };

    const snippets = await scrapeGoogleSearch(`site:linkedin.com/posts "ecommerce growth"`);
    const result = await generateHooksWithGemini({
      ...defaultSettings,
      snippets
    });

    res.json({ message: "Weekly automation ran successfully", result });
  } catch (error) {
    res.status(500).json({ error: "Failed to run weekly trigger" });
  }
});

export default router;
