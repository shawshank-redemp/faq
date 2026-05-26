const router = require('express').Router();
const { auth, optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.get('/:username', ctrl.getUserProfile);
router.get('/:username/questions', ctrl.getUserQuestions);
router.get('/:username/answers', ctrl.getUserAnswers);

router.get('/me/saved', auth, ctrl.getSavedQuestions);
router.post('/me/saved', auth, ctrl.saveQuestion);
router.delete('/me/saved/:questionId', auth, ctrl.unsaveQuestion);

module.exports = router;
