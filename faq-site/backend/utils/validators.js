const { body, query, param } = require('express-validator');

const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const questionValidation = [
  body('title').trim().isLength({ min: 10, max: 300 }).withMessage('Title must be 10-300 characters'),
  body('body').trim().isLength({ min: 20, max: 50000 }).withMessage('Body must be 20-50000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

const answerValidation = [
  body('body').trim().isLength({ min: 10, max: 50000 }).withMessage('Answer must be 10-50000 characters'),
];

const faqValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('slug').trim().isLength({ min: 3 }).withMessage('Slug must be at least 3 characters'),
];

module.exports = {
  registerValidation,
  loginValidation,
  questionValidation,
  answerValidation,
  faqValidation,
};
