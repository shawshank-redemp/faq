const { validationResult } = require('express-validator');
const Question = require('../models/Question');
const Tag = require('../models/Tag');
const { AppError } = require('../middleware/errorHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { indexQuestion, deleteQuestionIndex } = require('../services/searchService');
const { emitToQuestion } = require('../socket');

exports.createQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, body, tags } = req.body;
    let tagIds = [];
    let tagNames = [];

    if (tags && tags.length > 0) {
      const tagDocs = await Promise.all(
        tags.map(async (name) => {
          const normalized = name.toLowerCase().trim();
          const tag = await Tag.findOneAndUpdate(
            { name: normalized },
            { $setOnInsert: { name: normalized } },
            { upsert: true, new: true },
          );
          await Tag.findByIdAndUpdate(tag._id, { $inc: { questionCount: 1 } });
          return tag;
        }),
      );
      tagIds = tagDocs.map(t => t._id);
      tagNames = tagDocs.map(t => t.name);
    }

    const question = await Question.create({
      title,
      body,
      author: req.user._id,
      tags: tagIds,
      tagNames,
      lastActivity: new Date(),
    });

    await Question.findByIdAndUpdate(req.user._id, { $inc: { questionCount: 1 } });

    const populated = await Question.findById(question._id)
      .populate('author', 'username displayName avatar reputation')
      .populate('tags', 'name color');

    await indexQuestion(populated);

    res.status(201).json({ question: populated });
  } catch (err) {
    next(err);
  }
};

exports.getQuestions = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const filter = { status: 'open', isDeleted: false };

    if (req.query.tag) filter.tagNames = req.query.tag.toLowerCase();
    if (req.query.author) filter.author = req.query.author;
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const sort = {};
    switch (req.query.sort) {
      case 'newest': sort.createdAt = -1; break;
      case 'active': sort.lastActivity = -1; break;
      case 'votes': sort.upvotes = -1; break;
      case 'views': sort.viewCount = -1; break;
      default: sort.createdAt = -1;
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', 'username displayName avatar reputation')
        .populate('tags', 'name color'),
      Question.countDocuments(filter),
    ]);

    res.json({ questions, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('author', 'username displayName avatar reputation website')
      .populate('tags', 'name color description')
      .populate({
        path: 'acceptedAnswer',
        populate: { path: 'author', select: 'username displayName avatar reputation' },
      });

    if (!question) throw new AppError('Question not found', 404);

    await Question.findByIdAndUpdate(question._id, { $inc: { viewCount: 1 } });

    res.json({ question });
  } catch (err) {
    next(err);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) throw new AppError('Question not found', 404);
    if (question.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('Not authorized', 403);
    }

    const { title, body, tags } = req.body;
    if (title) question.title = title;
    if (body) question.body = body;
    if (tags) {
      const tagDocs = await Promise.all(
        tags.map(async (name) => {
          const tag = await Tag.findOneAndUpdate(
            { name: name.toLowerCase().trim() },
            { $setOnInsert: { name: name.toLowerCase().trim() } },
            { upsert: true, new: true },
          );
          return tag;
        }),
      );
      question.tags = tagDocs.map(t => t._id);
      question.tagNames = tagDocs.map(t => t.name);
    }

    await question.save();
    const updated = await Question.findById(question._id)
      .populate('author', 'username displayName avatar reputation')
      .populate('tags', 'name color');
    await indexQuestion(updated);
    res.json({ question: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question || question.isDeleted) throw new AppError('Question not found', 404);
    if (question.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('Not authorized', 403);
    }

    question.status = 'deleted';
    question.isDeleted = true;
    await question.save();
    await deleteQuestionIndex(question._id);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    next(err);
  }
};
