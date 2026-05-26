const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const SavedQuestion = require('../models/SavedQuestion');
const { AppError } = require('../middleware/errorHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) throw new AppError('User not found', 404);

    const [questions, answers] = await Promise.all([
      Question.countDocuments({ author: user._id, isDeleted: false }),
      Answer.countDocuments({ author: user._id, isDeleted: false }),
    ]);

    res.json({ user: { ...user.toPublicJSON(), questionCount: questions, answerCount: answers } });
  } catch (err) {
    next(err);
  }
};

exports.getUserQuestions = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) throw new AppError('User not found', 404);

    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const [questions, total] = await Promise.all([
      Question.find({ author: user._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('tags', 'name color')
        .select('title upvotes answerCount viewCount createdAt tagNames'),
      Question.countDocuments({ author: user._id, isDeleted: false }),
    ]);

    res.json({ questions, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

exports.getUserAnswers = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) throw new AppError('User not found', 404);

    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const [answers, total] = await Promise.all([
      Answer.find({ author: user._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'question', select: 'title slug', match: { isDeleted: false } })
        .select('body upvotes isAccepted createdAt'),
      Answer.countDocuments({ author: user._id, isDeleted: false }),
    ]);

    res.json({ answers: answers.filter(a => a.question), pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

exports.saveQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.body;
    const question = await Question.findById(questionId);
    if (!question) throw new AppError('Question not found', 404);

    const existing = await SavedQuestion.findOne({ user: req.user._id, question: questionId });
    if (existing) throw new AppError('Already saved', 409);

    await SavedQuestion.create({ user: req.user._id, question: questionId });
    await Question.findByIdAndUpdate(questionId, { $inc: { saveCount: 1 } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { savedCount: 1 } });

    res.status(201).json({ message: 'Question saved' });
  } catch (err) {
    next(err);
  }
};

exports.unsaveQuestion = async (req, res, next) => {
  try {
    const saved = await SavedQuestion.findOne({ user: req.user._id, question: req.params.questionId });
    if (!saved) throw new AppError('Not saved', 404);

    await saved.deleteOne();
    await Question.findByIdAndUpdate(req.params.questionId, { $inc: { saveCount: -1 } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { savedCount: -1 } });

    res.json({ message: 'Question unsaved' });
  } catch (err) {
    next(err);
  }
};

exports.getSavedQuestions = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const [saved, total] = await Promise.all([
      SavedQuestion.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'question',
          match: { isDeleted: false },
          populate: { path: 'author', select: 'username displayName avatar reputation' },
        }),
      SavedQuestion.countDocuments({ user: req.user._id }),
    ]);

    res.json({ saved: saved.filter(s => s.question), pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    next(err);
  }
};
