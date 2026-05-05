export function computeVirality(posts) {
  const now = new Date();

  return posts.map(post => {
    const postDate = new Date(post.timestamp);
    if (isNaN(postDate)) return null;

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

export function filterByTime(posts, timeRange) {
  const now = new Date();

  return posts.filter(post => {
    const postDate = new Date(post.timestamp);
    const hoursSincePost = (now - postDate) / (1000 * 60 * 60);

    if (timeRange === '24h') return hoursSincePost <= 24;
    if (timeRange === '1w') return hoursSincePost <= 168;

    return true;
  });
}

export function extractPatterns(posts) {
  const patterns = {
    contrarian: [],
    painPoint: [],
    curiosity: [],
    numberLed: []
  };

  posts.forEach(post => {
    const text = post.text.toLowerCase().replace(/[^\w\s]/g, '');

    if (text.includes("stop doing") || text.includes("unpopular opinion") || text.includes("myth")) {
      patterns.contrarian.push(post.text);
    }

    if (text.includes("mistake") || text.includes("leaking") || text.includes("struggling")) {
      patterns.painPoint.push(post.text);
    }

    if (text.includes("what happens when") || text.includes("why you should")) {
      patterns.curiosity.push(post.text);
    }

    if (/\d+%/.test(text) || /\$\d+/.test(text) || /\b\d+x\b/.test(text)) {
      patterns.numberLed.push(post.text);
    }
  });

  return {
    examples: {
      contrarian: patterns.contrarian.slice(0, 3),
      painPoint: patterns.painPoint.slice(0, 3),
      curiosity: patterns.curiosity.slice(0, 3),
      numberLed: patterns.numberLed.slice(0, 3)
    }
  };
}

export function processViralPosts(posts, timeRange = '1w') {
  // ✅ ONLY FILTER ONCE
  const filtered = filterByTime(posts, timeRange);

  // ✅ SCORE ONCE
  const scored = computeVirality(filtered);

  if (scored.length === 0) {
    return { topPosts: [], patterns: {}, totalProcessed: 0 };
  }

  // ✅ NEW: threshold-based selection (not %)
  const maxScore = scored[0].viralScore;

  const threshold = maxScore * 0.4; // keep top 40% of peak

  let topPosts = scored.filter(p => p.viralScore >= threshold);

  // ✅ fallback (avoid empty / too small set)
  if (topPosts.length < 3) {
    topPosts = scored.slice(0, Math.min(5, scored.length));
  }

  const patterns = extractPatterns(topPosts);

  return {
    topPosts,
    patterns,
    totalProcessed: scored.length
  };
}