// -----------------------------
// UTILS
// -----------------------------

function isContentPost(text = "") {
  const lower = text.toLowerCase();

  const rejectPatterns = [
    "i’m looking for",
    "we’re hiring",
    "we are hiring",
    "looking for someone",
    "please dm",
    "job",
    "hiring",
    "opportunity",
    "apply now"
  ];

  return !rejectPatterns.some(p => lower.includes(p));
}

function hasMinimumEngagement(post) {
  const likes = post.likes || 0;
  const comments = post.comments || 0;
  return (likes + comments) >= 10;
}

// -----------------------------
// VIRALITY SCORING
// -----------------------------

export function computeVirality(posts) {
  const now = new Date();

  return posts
    .map(post => {
      const postDate = new Date(post.timestamp);
      if (isNaN(postDate)) return null;

      const hoursSincePost = Math.max(
        0,
        (now - postDate) / (1000 * 60 * 60)
      );

      const likes = post.likes || 0;
      const comments = post.comments || 0;
      const shares = post.shares || 0;

      // ✅ Adjusted weights (less extreme)
      const engagementScore =
        (likes * 1) +
        (comments * 3) +
        (shares * 5);

      // ✅ FIXED decay (less aggressive)
      const timeDecay = Math.pow(hoursSincePost + 2, 0.8);

      const viralScore = engagementScore / timeDecay;

      return {
        ...post,
        hoursSincePost,
        viralScore
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.viralScore - a.viralScore);
}

// -----------------------------
// TIME FILTER
// -----------------------------

export function filterByTime(posts, timeRange) {
  const now = new Date();

  return posts.filter(post => {
    const postDate = new Date(post.timestamp);
    const hoursSincePost =
      (now - postDate) / (1000 * 60 * 60);

    if (timeRange === "24h") return hoursSincePost <= 24;
    if (timeRange === "1w") return hoursSincePost <= 168;

    return true;
  });
}

// -----------------------------
// PATTERN EXTRACTION (minor improvement)
// -----------------------------

export function extractPatterns(posts) {
  const patterns = {
    contrarian: [],
    painPoint: [],
    curiosity: [],
    numberLed: []
  };

  posts.forEach(post => {
    const text = post.text.toLowerCase();

    if (
      text.includes("stop doing") ||
      text.includes("unpopular opinion") ||
      text.includes("myth")
    ) {
      patterns.contrarian.push(post.text);
    }

    if (
      text.includes("mistake") ||
      text.includes("leaking") ||
      text.includes("struggling") ||
      text.includes("wrong")
    ) {
      patterns.painPoint.push(post.text);
    }

    if (
      text.includes("what happens when") ||
      text.includes("why you should") ||
      text.includes("here’s why")
    ) {
      patterns.curiosity.push(post.text);
    }

    // ✅ IMPROVED number detection
    if (
      /\b\d+\b/.test(text) ||
      /\d+%/.test(text) ||
      /\$\d+/.test(text) ||
      /\b\d+x\b/.test(text)
    ) {
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

// -----------------------------
// MAIN PIPELINE
// -----------------------------

export function processViralPosts(posts, timeRange = "1w") {
  // ✅ STEP 1: Time filter
  const timeFiltered = filterByTime(posts, timeRange);

  // ✅ STEP 2: Content + engagement filter (NEW CRITICAL STEP)
  const cleaned = timeFiltered.filter(post =>
    isContentPost(post.text) && hasMinimumEngagement(post)
  );

  // Safety fallback
  const base = cleaned.length > 0 ? cleaned : timeFiltered;

  // ✅ STEP 3: Scoring
  const scored = computeVirality(base);

  if (scored.length === 0) {
    return {
      topPosts: [],
      patterns: {},
      totalProcessed: 0
    };
  }

  // ✅ STEP 4: TOP-K selection (REPLACES THRESHOLD)
  const k = Math.max(5, Math.floor(scored.length * 0.3));
  const topPosts = scored.slice(0, k);

  // ✅ STEP 5: Pattern extraction
  const patterns = extractPatterns(topPosts);

  return {
    topPosts,
    patterns,
    totalProcessed: scored.length
  };
}