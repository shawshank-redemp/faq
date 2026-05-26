const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['Question', 'Answer'],
    required: true,
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType',
    required: true,
  },
  voteType: {
    type: String,
    enum: ['upvote', 'downvote'],
    required: true,
  },
}, { timestamps: true });

voteSchema.index({ user: 1, target: 1, targetType: 1 }, { unique: true });
voteSchema.index({ target: 1, targetType: 1 });

module.exports = mongoose.model('Vote', voteSchema);
