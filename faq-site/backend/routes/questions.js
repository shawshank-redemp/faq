const router = require('express').Router();
const { auth, optionalAuth } = require('../middleware/auth');
const { questionValidation } = require('../utils/validators');
const ctrl = require('../controllers/questionController');

router.get('/', ctrl.getQuestions);
router.get('/:id', optionalAuth, ctrl.getQuestion);
router.post('/', auth, questionValidation, ctrl.createQuestion);
router.put('/:id', auth, ctrl.updateQuestion);
router.delete('/:id', auth, ctrl.deleteQuestion);

module.exports = router;
