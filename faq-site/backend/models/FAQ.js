const mongoose = require('mongoose');

const faqItemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  answer: {
    type: String,
    required: true,
    maxlength: 50000,
  },
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  helpfulCount: { type: Number, default: 0 },
  notHelpfulCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  lastReviewed: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const faqPageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: { type: String, maxlength: 1000 },
  category: { type: String },
  icon: { type: String },

  items: [faqItemSchema],

  // Meta
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isOfficial: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },

  // Tags for discoverability
  tags: [{ type: String }],

  // Moderation
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

faqPageSchema.index({ title: 'text', description: 'text' });
faqPageSchema.index({ category: 1 });
faqPageSchema.index({ isPublished: 1 });

module.exports = mongoose.model('FAQ', faqPageSchema);
