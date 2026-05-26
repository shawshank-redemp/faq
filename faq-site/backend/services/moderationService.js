const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const Notification = require('../models/Notification');

const flagContent = async ({ targetType, targetId, reason, flaggedBy }) => {
  let target;
  if (targetType === 'Question') {
    target = await Question.findById(targetId);
  } else if (targetType === 'Answer') {
    target = await Answer.findById(targetId);
  }
  if (!target) throw new Error('Target not found');

  target.isFlagged = true;
  target.flagReason = reason;
  target.flaggedBy = flaggedBy;
  await target.save();

  // Notify admins
  const admins = await User.find({ role: 'admin' });
  const notifications = admins.map(admin => ({
    recipient: admin._id,
    type: 'moderation',
    title: 'Content flagged',
    message: `${targetType} flagged: ${reason}`,
    link: `/${targetType === 'Question' ? 'questions' : 'answers'}/${targetId}`,
    referenceType: targetType,
    reference: targetId,
  }));
  await Notification.insertMany(notifications);
};

const closeQuestion = async ({ questionId, reason, closedBy }) => {
  const question = await Question.findById(questionId);
  if (!question) throw new Error('Question not found');
  question.status = 'closed';
  question.closedReason = reason;
  question.closedBy = closedBy;
  question.closedAt = new Date();
  await question.save();
};

const deleteContent = async ({ targetType, targetId }) => {
  if (targetType === 'Question') {
    await Question.findByIdAndUpdate(targetId, { status: 'deleted', isDeleted: true });
  } else if (targetType === 'Answer') {
    await Answer.findByIdAndUpdate(targetId, { status: 'deleted', isDeleted: true });
  }
};

const banUser = async ({ userId, reason }) => {
  await User.findByIdAndUpdate(userId, { isBanned: true, banReason: reason });
};

const unbanUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { isBanned: false, banReason: null });
};

module.exports = { flagContent, closeQuestion, deleteContent, banUser, unbanUser };
