const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 50,
  },
  description: { type: String, maxlength: 500 },
  color: { type: String, default: '#6366f1' },
  icon: { type: String },
  category: { type: String },
  isOfficial: { type: Boolean, default: false },
  questionCount: { type: Number, default: 0 },
}, { timestamps: true });

tagSchema.index({ name: 'text', description: 'text' });
tagSchema.index({ questionCount: -1 });

module.exports = mongoose.model('Tag', tagSchema);
