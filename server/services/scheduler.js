import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { fetchLinkedInPosts } from './apifyService.js';
import { processViralPosts } from './viralEngine.js';
import { generateHooksWithGroq } from './groq.js';
import { saveHooks } from './dbService.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USE_FIXTURES = process.env.USE_FIXTURES === 'true';

const fixturePosts = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/linkedinPosts.json'), 'utf-8')
);

function getPatternExamples(patterns) {
  return patterns.examples ? [
    ...patterns.examples.contrarian,
    ...patterns.examples.painPoint,
    ...patterns.examples.curiosity,
    ...patterns.examples.numberLed
  ] : [];
}

function buildQueries() {
  return [
    '"product page" ecommerce OR "amazon listing" optimization OR "bad product page" OR "why ads don’t convert"'
  ];
}

async function getPosts(timeRange) {
  if (USE_FIXTURES) {
    console.log('[Scheduler] Using fixture data');
    return fixturePosts;
  }

  console.log('[Scheduler] Using Apify');
  const queries = buildQueries();
  return await fetchLinkedInPosts(queries, timeRange);
}

async function runWeeklyReport() {
  console.log('[Scheduler] Running Weekly Viral Hooks Report...');

  try {
    const mode = 'Pixii';
    const goal = 'Get leads';
    const tone = 'Contrarian';

    // 🔥 SAME PIPELINE AS MAIN ROUTE
    const rawPosts = await getPosts('1w');

    const { topPosts, patterns } = processViralPosts(rawPosts, '1w');

    const result = await generateHooksWithGroq({
      mode,
      goal,
      tone,
      topPosts: topPosts.map(p => p.text),
      patterns: getPatternExamples(patterns)
    });

    // 🔥 SAVE TO DB
    await saveHooks({
      hooks: result.hooks,
      explanations: result.explanations,
      trends: result.trends,
      source: USE_FIXTURES ? 'fixture' : 'apify',
      mode,
      topic: null,
      goal,
      tone
    });

    // 🔥 EMAIL
    await sendWeeklyEmail(result);

    console.log('[Scheduler] Weekly report completed successfully.');

  } catch (error) {
    console.error('[Scheduler] Failed:', error);
  }
}

async function sendWeeklyEmail({ hooks, explanations, trends }) {
  const emailTo = process.env.EMAIL_USER;

  if (!emailTo) {
    console.warn('[Scheduler] EMAIL_USER not set.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let htmlContent = `<h2>Weekly Viral Hooks Report – Pixii</h2>`;

  (hooks || []).forEach((hook, i) => {
    htmlContent += `
      <p><strong>${hook}</strong><br/>
      <em>${explanations?.[i] || ''}</em></p>
    `;
  });

  if (trends?.length) {
    htmlContent += `<h3>Trends</h3><ul>`;
    trends.forEach(t => htmlContent += `<li>${t}</li>`);
    htmlContent += `</ul>`;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: emailTo,
    subject: 'Weekly Viral Hooks Report – Pixii',
    html: htmlContent
  });
}

export function startScheduler() {
  cron.schedule('0 7 * * 1', runWeeklyReport, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('[Scheduler] Weekly cron job initialized');
}