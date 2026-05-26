const { getRedis } = require('../config/redis');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const FAQ = require('../models/FAQ');
const Vote = require('../models/Vote');

const getDashboardStats = async () => {
  const redis = getRedis();
  const cacheKey = 'analytics:dashboard';

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  const [totalQuestions, totalAnswers, totalUsers, totalFAQs, totalVotes] = await Promise.all([
    Question.countDocuments({ isDeleted: false }),
    Answer.countDocuments({ isDeleted: false }),
    User.countDocuments(),
    FAQ.countDocuments({ isPublished: true }),
    Vote.countDocuments(),
  ]);

  const questionsToday = await Question.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  const resolutionRate = totalQuestions > 0
    ? Math.round((await Question.countDocuments({ acceptedAnswer: { $ne: null } }) / totalQuestions) * 100)
    : 0;

  const stats = {
    totalQuestions,
    totalAnswers,
    totalUsers,
    totalFAQs,
    totalVotes,
    questionsToday,
    resolutionRate,
  };

  try {
    await redis.setex(cacheKey, 300, JSON.stringify(stats));
  } catch (_) {}

  return stats;
};

const getFAQAnalytics = async (faqId) => {
  const faq = await FAQ.findById(faqId);
  if (!faq) throw new Error('FAQ not found');

  const totalFeedback = faq.items.reduce((sum, item) => sum + item.helpfulCount + item.notHelpfulCount, 0);
  const helpfulnessScore = totalFeedback > 0
    ? Math.round((faq.items.reduce((sum, item) => sum + item.helpfulCount, 0) / totalFeedback) * 100)
    : 0;

  return {
    viewCount: faq.viewCount,
    itemCount: faq.items.length,
    totalFeedback,
    helpfulnessScore,
    publishedItems: faq.items.filter(i => i.isPublished).length,
    lastUpdated: faq.updatedAt,
  };
};

const getSearchSuccessRate = async () => {
  const redis = getRedis();
  const key = 'analytics:search:total';
  const successKey = 'analytics:search:success';
  try {
    const total = parseInt(await redis.get(key)) || 0;
    const success = parseInt(await redis.get(successKey)) || 0;
    return { total, success, rate: total > 0 ? Math.round((success / total) * 100) : 0 };
  } catch (_) {
    return { total: 0, success: 0, rate: 0 };
  }
};

const recordSearch = async (query) => {
  const redis = getRedis();
  try {
    await redis.incr('analytics:search:total');
  } catch (_) {}
};

const recordSearchSuccess = async (query) => {
  const redis = getRedis();
  try {
    await redis.incr('analytics:search:success');
  } catch (_) {}
};

module.exports = { getDashboardStats, getFAQAnalytics, getSearchSuccessRate, recordSearch, recordSearchSuccess };
