const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw new AppError('Username or email already exists', 409);
    }

    const user = await User.create({ username, email, password, displayName: username });
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBanned) {
      throw new AppError(`Account banned: ${user.banReason}`, 403);
    }

    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    const allowed = ['displayName', 'bio', 'website', 'location', 'preferences'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};
