import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const pixiiContext = `
Pixii is an AI-powered ecommerce growth platform.
It helps brands improve conversions using better content, insights, and AI-driven decision making.
Target audience: Ecommerce founders, D2C brands, Marketing teams.
Core beliefs:
- Traffic is not the problem, conversion is.
- Content drives revenue.
- Most brands misunderstand growth.
Tone: Contrarian, Insight-driven, Sharp, bold, no fluff.
`;

export async function generateHooksWithGroq({ mode, niche, topic, goal, tone, topPosts, patterns }) {
  const isPixii = mode === 'Pixii';

  let promptStr = `You are an expert LinkedIn copywriter. I need you to generate viral LinkedIn hooks.\n\n`;

  if (isPixii) {
    promptStr += `Mode: Pixii Growth Engine\n`;
    promptStr += `Brand Context:\n${pixiiContext}\n`;
    promptStr += `STRICT PIXII REQUIREMENT: You MUST target ecommerce founders and emphasize revenue, Amazon listings, conversion rates, and product images.\n`;
    if (topic) promptStr += `Topic Focus: ${topic}\n`;
  } else {
    promptStr += `Mode: Business Hooks\n`;
    if (niche) promptStr += `Niche: ${niche}\n`;
  }

  promptStr += `\nGoal: ${goal || 'Get leads'}\n`;
  promptStr += `Tone: ${tone || 'Contrarian'}\n`;

  if (patterns && patterns.length > 0) {
    promptStr += `\nExtracted Viral Patterns to emulate:\n`;
    patterns.forEach(p => promptStr += `- ${p}\n`);
  }

  if (topPosts && topPosts.length > 0) {
    promptStr += `\nTop Performing Industry Posts for trend analysis:\n`;
    topPosts.forEach(p => promptStr += `- ${p}\n`);
  }

  promptStr += `
  
Task:
Based on the context, goal, tone, extracted patterns, and top posts above, please generate:
1. 5 viral LinkedIn hooks. Focus on contrarian hooks, pain-point hooks, and curiosity hooks. Emulate the extracted patterns.
2. For each hook, provide a brief explanation of why it works.
3. List the structural patterns you observed and utilized.
4. Provide 2-3 trend insights derived from the provided top posts.

Return ONLY a valid JSON object matching this schema exactly (do not wrap in markdown or anything else):
{
  "hooks": ["Hook text 1", "Hook text 2"],
  "explanations": ["Explanation for hook 1", "Explanation for hook 2"],
  "patterns": ["Pattern 1", "Pattern 2"],
  "trend_insights": ["Trend insight 1", "Trend insight 2"]
}
`;

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: promptStr }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const data = JSON.parse(completion.choices[0].message.content);
    return data;
  } catch (error) {
    console.error("Groq Generation Error:", error);
    throw new Error("Failed to generate hooks using AI.");
  }
}