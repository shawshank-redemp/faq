const { searchAll, getDidYouMean } = require('../services/searchService');
const { recordSearch, recordSearchSuccess } = require('../services/analyticsService');
const { getRedis } = require('../config/redis');

exports.search = async (req, res, next) => {
  try {
    const { q, tags, type, page = 1, limit = 20 } = req.query;
    if (!q && !tags) {
      return res.json({ results: [], total: 0, suggestions: [] });
    }

    await recordSearch(q || '');

    const result = await searchAll({
      query: q,
      tags: tags ? tags.split(',') : [],
      type,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    // Mark as success if results found
    if (result.total > 0) {
      await recordSearchSuccess(q || '');
    }

    // "Did you mean?" — only fires on zero results to avoid wasted work
    let didYouMean = { correction: null, relatedFAQs: [] };
    if (result.total === 0 && q && q.trim().length >= 2) {
      didYouMean = await getDidYouMean(q);
    }

    // Get search suggestions from cache
    let suggestions = [];
    try {
      const redis = getRedis();
      const suggestionsKey = 'search:suggestions';
      const raw = await redis.lrange(suggestionsKey, 0, 9);
      suggestions = raw.map(r => JSON.parse(r));
    } catch (_) {}

    // Store query for future suggestions
    if (q && q.length >= 3) {
      try {
        const redis = getRedis();
        const suggestionsKey = 'search:suggestions';
        const exists = await redis.lpos(suggestionsKey, JSON.stringify({ query: q }));
        if (exists === null) {
          await redis.lpush(suggestionsKey, JSON.stringify({ query: q, count: 1, timestamp: Date.now() }));
          await redis.ltrim(suggestionsKey, 0, 99);
        }
      } catch (_) {}
    }

    res.json({ ...result, suggestions, didYouMean });
  } catch (err) {
    next(err);
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const redis = getRedis();
    const raw = await redis.lrange('search:suggestions', 0, 9);
    const suggestions = raw.map(r => JSON.parse(r));
    res.json({ suggestions });
  } catch (_) {
    res.json({ suggestions: [] });
  }
};
