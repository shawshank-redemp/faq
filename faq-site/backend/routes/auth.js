const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation } = require('../utils/validators');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/authController');

router.post('/register', authLimiter, registerValidation, ctrl.register);
router.post('/login', authLimiter, loginValidation, ctrl.login);
router.get('/me', auth, ctrl.getMe);
router.put('/profile', auth, upload.single('avatar'), ctrl.updateProfile);

module.exports = router;
