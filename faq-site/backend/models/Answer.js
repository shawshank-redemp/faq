const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
    maxlength: 50000,
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isAccepted: { type: Boolean, default: false },

  // Stats
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },

  // Moderation
  isDeleted: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  },

  // For official/verified answers
  isOfficial: { type: Boolean, default: false },
}, { timestamps: true });

answerSchema.index({ question: 1, createdAt: 1 });
answerSchema.index({ author: 1 });
answerSchema.index({ upvotes: -1 });
answerSchema.index({ isAccepted: 1 });
answerSchema.index({ isOfficial: 1 });

module.exports = mongoose.model('Answer', answerSchema);
