const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { AppError } = require('../middleware/errorHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { getDashboardStats } = require('../services/analyticsService');
const { banUser, unbanUser } = require('../services/moderationService');
const { getRedis } = require('../config/redis');

exports.getDashboard = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password'),
      User.countDocuments(filter),
    ]);

    res.json({ users, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await banUser({ userId: req.params.id, reason: reason || 'Violation of terms' });
    res.json({ message: 'User banned' });
  } catch (err) {
    next(err);
  }
};

exports.unbanUser = async (req, res, next) => {
  try {
    await unbanUser(req.params.id);
    res.json({ message: 'User unbanned' });
  } catch (err) {
    next(err);
  }
};

exports.getFlaggedContent = async (req, res, next) => {
  try {
    const [flaggedQuestions, flaggedAnswers] = await Promise.all([
      Question.find({ isFlagged: true, isDeleted: false })
        .populate('author', 'username displayName')
        .populate('flaggedBy', 'username')
        .select('title flagReason createdAt'),
      Answer.find({ isFlagged: true, isDeleted: false })
        .populate('author', 'username displayName')
        .populate('flaggedBy', 'username')
        .select('body flagReason createdAt'),
    ]);

    res.json({ flaggedQuestions, flaggedAnswers });
  } catch (err) {
    next(err);
  }
};

exports.clearCache = async (req, res) => {
  try {
    const redis = getRedis();
    await redis.flushall();
    res.json({ message: 'Cache cleared' });
  } catch (_) {
    res.json({ message: 'Cache not available' });
  }
};
