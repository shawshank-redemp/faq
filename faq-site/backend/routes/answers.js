const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { answerValidation } = require('../utils/validators');
const ctrl = require('../controllers/answerController');

router.get('/question/:questionId', ctrl.getAnswers);
router.post('/question/:questionId', auth, answerValidation, ctrl.createAnswer);
router.put('/:id', auth, ctrl.updateAnswer);
router.delete('/:id', auth, ctrl.deleteAnswer);
router.post('/:id/accept', auth, ctrl.acceptAnswer);

module.exports = router;
