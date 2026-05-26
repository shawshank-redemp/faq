const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'new_answer',
      'answer_accepted',
      'upvote',
      'downvote',
      'comment',
      'mention',
      'follow',
      'badge',
      'system',
      'moderation',
      'faq_update',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String },
  link: { type: String },
  icon: { type: String },

  // Reference to the related entity
  referenceType: {
    type: String,
    enum: ['Question', 'Answer', 'FAQ', 'User', null],
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceType',
  },

  isRead: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ reference: 1, referenceType: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
