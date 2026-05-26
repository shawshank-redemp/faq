const mongoose = require('mongoose');

const savedQuestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  notes: { type: String, maxlength: 500 },
  tags: [{ type: String }],
}, { timestamps: true });

savedQuestionSchema.index({ user: 1, question: 1 }, { unique: true });
savedQuestionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SavedQuestion', savedQuestionSchema);
