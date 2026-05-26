const { getRedis } = require('../config/redis');
const Question = require('../models/Question');
const Tag = require('../models/Tag');

const CACHE_TTL = 3600;

const getRecommendedQuestions = async (userId, page = 1, limit = 20) => {
  const redis = getRedis();
  const cacheKey = `rec:${userId || 'anon'}:${page}:${limit}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  let pipeline = [];

  if (userId) {
    const user = await (require('../models/User')).findById(userId);
    if (user) {
      const recentQuestions = await Question.find({ author: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('tags');
      const tagIds = [...new Set(recentQuestions.flatMap(q => q.tags.map(t => t.toString())))];
      if (tagIds.length > 0) {
        pipeline.push({ $match: { tags: { $in: tagIds }, author: { $ne: userId }, status: 'open', isDeleted: false } });
      }
    }
  }

  if (pipeline.length === 0) {
    pipeline.push({ $match: { status: 'open', isDeleted: false } });
  }

  pipeline.push(
    { $sort: { lastActivity: -1, upvotes: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
      },
    },
    { $unwind: '$author' },
    {
      $lookup: {
        from: 'tags',
        localField: 'tags',
        foreignField: '_id',
        as: 'tags',
      },
    },
    {
      $project: {
        title: 1,
        body: { $substrCP: ['$body', 0, 300] },
        upvotes: 1,
        answerCount: 1,
        viewCount: 1,
        createdAt: 1,
        lastActivity: 1,
        tagNames: 1,
        'author.username': 1,
        'author.displayName': 1,
        'author.avatar': 1,
        'author.reputation': 1,
      },
    },
  );

  const questions = await Question.aggregate(pipeline);
  const result = { questions, page, limit };

  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (_) {}

  return result;
};

const getTrendingQuestions = async (page = 1, limit = 20) => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return Question.find({
    status: 'open',
    isDeleted: false,
    createdAt: { $gte: threeDaysAgo },
  })
    .sort({ upvotes: -1, viewCount: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'username displayName avatar reputation')
    .populate('tags', 'name color')
    .select('title upvotes answerCount viewCount createdAt tagNames');
};

module.exports = { getRecommendedQuestions, getTrendingQuestions };
