export function computeVirality(posts) {
  const now = new Date();

  return posts.map(post => {
    const postDate = new Date(post.timestamp);
    if (isNaN(postDate)) return null;
    // Calculate hours since post, ensuring it's at least 0
    const hoursSincePost = Math.max(0, (now - postDate) / (1000 * 60 * 60));
    
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    const shares = post.shares || 0;

    const engagementScore = (likes * 1) + (comments * 4) + (shares * 8);
    const timeDecay = Math.pow(hoursSincePost + 2, 1.3);

    const viralScore = engagementScore / timeDecay;

    return {
      ...post,
      hoursSincePost,
      viralScore
    };
  }).filter(Boolean).sort((a, b) => b.viralScore - a.viralScore);
}

/**
 * Filters posts based on a time range.
 * @param {Array} posts 
 * @param {string} timeRange - "24h" or "1w"
 */
export function filterByTime(posts, timeRange) {
  const now = new Date();
  
  return posts.filter(post => {
    const postDate = new Date(post.timestamp);
    const hoursSincePost = (now - postDate) / (1000 * 60 * 60);

    if (timeRange === '24h') {
      return hoursSincePost <= 24;
    } else if (timeRange === '1w') {
      return hoursSincePost <= 168; // 7 days * 24 hours
    }
    return true; // Default no filter
  });
}

/**
 * Extracts patterns from the text of the posts.
 * This is a basic rule-based extractor. It can be enhanced with NLP or LLMs later.
 */
export function extractPatterns(posts) {
  const patterns = {
    contrarian: [],
    painPoint: [],
    curiosity: [],
    numberLed: []
  };

  posts.forEach(post => {
    const text = post.text.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Contrarian
    if (text.includes("stop doing") || text.includes("unpopular opinion") || text.includes("myth") || text.includes("nobody talks about")) {
      patterns.contrarian.push(post.text);
    }
    
    // Pain-point
    if (text.includes("mistake") || text.includes("leaking") || text.includes("tired of") || text.includes("struggling")) {
      patterns.painPoint.push(post.text);
    }
    
    // Curiosity
    if (text.includes("what happens when") || text.includes("the secret to") || text.includes("why you should")) {
      patterns.curiosity.push(post.text);
    }
    
    // Number-led
    if (/\b\d+x\b/.test(text) || /\$\d+/.test(text) || /\d+%\s*(increase|growth|boost)/.test(text)) {
      patterns.numberLed.push(post.text);
    }
  });

  // Extract common phrases (simple n-gram approximation or just returning the structured examples)
  return {
    summary: "Extracted structural patterns based on top posts.",
    examples: {
      contrarian: patterns.contrarian.slice(0, 3),
      painPoint: patterns.painPoint.slice(0, 3),
      curiosity: patterns.curiosity.slice(0, 3),
      numberLed: patterns.numberLed.slice(0, 3)
    }
  };
}

/**
 * Main pipeline: filters, scores, selects top %, and extracts patterns.
 */
export function processViralPosts(rawPosts, timeRange = '1w') {
  // 1. Time filter
  const filtered = filterByTime(rawPosts, timeRange);
  
  // 2. Score and sort
  const scored = computeVirality(filtered);
  // const strongPosts = scored.filter(p => p.viralScore > 5);
  
  // 3. Select top 20%
  const topCount = Math.max(1, Math.ceil(scored.length * 0.2));
  const topPosts = scored.slice(0, topCount);
  // const topPosts = strongPosts.slice(0, topCount);
  
  // 4. Extract patterns from top posts
  const patterns = extractPatterns(topPosts);

  return {
    topPosts,
    patterns,
    totalProcessed: scored.length,
    timeRange
  };
}
