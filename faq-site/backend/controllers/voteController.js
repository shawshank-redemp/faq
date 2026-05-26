const Vote = require('../models/Vote');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');
const { emitToUser } = require('../socket');

exports.vote = async (req, res, next) => {
  try {
    const { targetType, targetId, voteType } = req.body;
    if (!['Question', 'Answer'].includes(targetType)) {
      throw new AppError('Invalid target type', 400);
    }
    if (!['upvote', 'downvote'].includes(voteType)) {
      throw new AppError('Invalid vote type', 400);
    }

    const Model = targetType === 'Question' ? Question : Answer;
    const target = await Model.findById(targetId);
    if (!target || target.isDeleted) throw new AppError('Target not found', 404);

    const existingVote = await Vote.findOne({
      user: req.user._id,
      target: targetId,
      targetType,
    });

    // Toggle: remove if same vote
    if (existingVote && existingVote.voteType === voteType) {
      await existingVote.deleteOne();
      const inc = voteType === 'upvote' ? -1 : -1;
      await Model.findByIdAndUpdate(targetId, {
        $inc: { [`${voteType}s`]: -1 },
      });
      if (target.author.toString() !== req.user._id.toString()) {
        await User.findByIdAndUpdate(target.author, { $inc: { reputation: voteType === 'upvote' ? -10 : 10 } });
      }
      return res.json({ message: 'Vote removed', vote: null });
    }

    // Change vote direction
    if (existingVote) {
      const oldType = existingVote.voteType;
      existingVote.voteType = voteType;
      await existingVote.save();
      await Model.findByIdAndUpdate(targetId, {
        $inc: { [`${oldType}s`]: -1, [`${voteType}s`]: 1 },
      });
      const repChange = voteType === 'upvote' ? 10 : -10;
      if (target.author.toString() !== req.user._id.toString()) {
        await User.findByIdAndUpdate(target.author, { $inc: { reputation: voteType === 'upvote' ? 10 : -10 } });
      }
      return res.json({ message: 'Vote updated', vote: existingVote });
    }

    // New vote
    const vote = await Vote.create({
      user: req.user._id,
      target: targetId,
      targetType,
      voteType,
    });
    await Model.findByIdAndUpdate(targetId, { $inc: { [`${voteType}s`]: 1 } });

    // Reputation
    if (target.author.toString() !== req.user._id.toString()) {
      const repChange = voteType === 'upvote' ? 10 : -10;
      await User.findByIdAndUpdate(target.author, { $inc: { reputation: repChange } });
    }

    // Notify on upvote
    if (voteType === 'upvote' && target.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: target.author,
        type: 'upvote',
        title: 'You received an upvote',
        message: `Your ${targetType.toLowerCase()} received an upvote`,
        link: `/${targetType === 'Question' ? 'questions' : 'answers'}/${targetId}`,
        referenceType: targetType,
        reference: targetId,
      });
      emitToUser(target.author.toString(), 'notification:new', { upvote: true });
    }

    res.status(201).json({ message: 'Voted', vote });
  } catch (err) {
    next(err);
  }
};

exports.getVoteStatus = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;
    if (!req.user) return res.json({ vote: null });

    const vote = await Vote.findOne({
      user: req.user._id,
      target: targetId,
      targetType,
    });
    res.json({ vote: vote ? vote.voteType : null });
  } catch (err) {
    next(err);
  }
};
