const { validationResult } = require('express-validator');
const FAQ = require('../models/FAQ');
const { AppError } = require('../middleware/errorHandler');
const { paginate, buildPaginationMeta, generateSlug } = require('../utils/helpers');
const { indexFAQ, deleteFAQIndex } = require('../services/searchService');

exports.createFAQ = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, slug, description, category, icon, tags, items } = req.body;
    const finalSlug = slug || generateSlug(title);

    const existing = await FAQ.findOne({ slug: finalSlug });
    if (existing) throw new AppError('FAQ with this slug already exists', 409);

    const faq = await FAQ.create({
      title,
      slug: finalSlug,
      description,
      category,
      icon,
      tags,
      items: items || [],
      author: req.user._id,
    });

    await indexFAQ(faq);
    res.status(201).json({ faq });
  } catch (err) {
    next(err);
  }
};

exports.getFAQs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const filter = { isPublished: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const [faqs, total] = await Promise.all([
      FAQ.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title slug description category icon tags viewCount isOfficial createdAt items.isPublished items.question')
        .populate('author', 'username displayName'),
      FAQ.countDocuments(filter),
    ]);

    const faqsWithCounts = faqs.map(faq => ({
      ...faq.toObject(),
      itemCount: faq.items.filter(i => i.isPublished).length,
    }));

    res.json({ faqs: faqsWithCounts, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

exports.getFAQBySlug = async (req, res, next) => {
  try {
    const faq = await FAQ.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'username displayName avatar')
      .populate('items.reviewedBy', 'username displayName');

    if (!faq) throw new AppError('FAQ not found', 404);
    await FAQ.findByIdAndUpdate(faq._id, { $inc: { viewCount: 1 } });

    res.json({ faq });
  } catch (err) {
    next(err);
  }
};

exports.updateFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) throw new AppError('FAQ not found', 404);

    const allowed = ['title', 'description', 'category', 'icon', 'tags', 'isPublished', 'isOfficial'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) faq[field] = req.body[field];
    }
    if (req.body.items) faq.items = req.body.items;
    if (req.body.slug) faq.slug = req.body.slug;

    await faq.save();
    await indexFAQ(faq);
    res.json({ faq });
  } catch (err) {
    next(err);
  }
};

exports.deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) throw new AppError('FAQ not found', 404);
    await FAQ.findByIdAndDelete(req.params.id);
    await deleteFAQIndex(req.params.id);
    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    next(err);
  }
};

exports.addFAQItem = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) throw new AppError('FAQ not found', 404);

    const { question, answer, tags } = req.body;
    if (!question || !answer) throw new AppError('Question and answer required', 400);

    faq.items.push({
      question,
      answer,
      tags: tags || [],
      order: faq.items.length,
    });
    await faq.save();
    res.status(201).json({ faq });
  } catch (err) {
    next(err);
  }
};

exports.updateFAQItem = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) throw new AppError('FAQ not found', 404);

    const item = faq.items.id(req.params.itemId);
    if (!item) throw new AppError('FAQ item not found', 404);

    const allowed = ['question', 'answer', 'order', 'isPublished', 'tags'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    }

    item.lastReviewed = new Date();
    item.reviewedBy = req.user._id;

    await faq.save();
    res.json({ faq });
  } catch (err) {
    next(err);
  }
};

exports.deleteFAQItem = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) throw new AppError('FAQ not found', 404);
    faq.items.pull({ _id: req.params.itemId });
    await faq.save();
    res.json({ faq });
  } catch (err) {
    next(err);
  }
};

exports.markFAQHelpful = async (req, res, next) => {
  try {
    const { helpful } = req.body;
    const faq = await FAQ.findById(req.params.id);
    if (!faq) throw new AppError('FAQ not found', 404);

    const item = faq.items.id(req.params.itemId);
    if (!item) throw new AppError('FAQ item not found', 404);

    if (helpful) item.helpfulCount += 1;
    else item.notHelpfulCount += 1;

    await faq.save();
    res.json({ message: 'Feedback recorded' });
  } catch (err) {
    next(err);
  }
};
