const Tag = require('../models/Tag');
const Question = require('../models/Question');
const { AppError } = require('../middleware/errorHandler');

exports.getTags = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.category) filter.category = req.query.category;

    const tags = await Tag.find(filter)
      .sort({ questionCount: -1 })
      .limit(100);
    res.json({ tags });
  } catch (err) {
    next(err);
  }
};

exports.getTag = async (req, res, next) => {
  try {
    const tag = await Tag.findOne({ name: req.params.name.toLowerCase() });
    if (!tag) throw new AppError('Tag not found', 404);
    res.json({ tag });
  } catch (err) {
    next(err);
  }
};

exports.createTag = async (req, res, next) => {
  try {
    const { name, description, color, category } = req.body;
    const existing = await Tag.findOne({ name: name.toLowerCase().trim() });
    if (existing) throw new AppError('Tag already exists', 409);

    const tag = await Tag.create({ name: name.toLowerCase().trim(), description, color, category });
    res.status(201).json({ tag });
  } catch (err) {
    next(err);
  }
};

exports.updateTag = async (req, res, next) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tag) throw new AppError('Tag not found', 404);
    res.json({ tag });
  } catch (err) {
    next(err);
  }
};
