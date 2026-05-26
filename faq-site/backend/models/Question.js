const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  body: {
    type: String,
    required: true,
    maxlength: 50000,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  tagNames: [{ type: String }],

  // Stats
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  answerCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  saveCount: { type: Number, default: 0 },

  // Accepted answer
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null,
  },

  // Duplicate detection
  isDuplicate: { type: Boolean, default: false },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  },

  // Moderation
  isLocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closedAt: { type: Date },
  closedReason: { type: String },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: {
    type: String,
    enum: ['open', 'closed', 'deleted'],
    default: 'open',
  },

  // Timestamps
  lastActivity: { type: Date },
}, { timestamps: true });

questionSchema.index({ title: 'text', body: 'text' });
questionSchema.index({ author: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ upvotes: -1 });
questionSchema.index({ viewCount: -1 });
questionSchema.index({ lastActivity: -1 });
questionSchema.index({ title: 1 }, { collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Question', questionSchema);
