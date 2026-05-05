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

const goalMap = {
  "Get leads": "Focus on lead generation and conversions",
  "Increase engagement": "Focus on curiosity and engagement",
  "Build authority": "Focus on insights and expertise",
  "Drive conversions": "Focus on sales and decision triggers"
};

// 🔥 EDITED: removed mode, niche, topic → using instructions only
export async function generateHooksWithGroq({ instructions, goal, tone, topPosts, patterns }) {

  let promptStr = `You are an expert LinkedIn copywriter. I need you to generate viral LinkedIn hooks.\n\n`;

  promptStr += `Brand Context:\n${pixiiContext}\n`;
  promptStr += `STRICT PIXII REQUIREMENT: You MUST target ecommerce founders and emphasize revenue, Amazon listings, conversion rates, and product images.\n`;

  // 🔥 EDITED: instructions added as primary control
  if (instructions) {
    promptStr += `User Instructions: ${instructions}\n`;
  }

  promptStr += `Goal: ${goalMap[goal] || goal}\n`;
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
1. 4 viral LinkedIn hooks.
2. For each hook, provide a brief explanation of why it works.
3. List the structural patterns used.
4. Provide 2-3 trend insights.

Return ONLY JSON:
{
  "hooks": [],
  "explanations": [],
  "patterns": [],
  "trend_insights": []
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