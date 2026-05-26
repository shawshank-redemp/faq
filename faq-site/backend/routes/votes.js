const router = require('express').Router();
const { auth, optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/voteController');

router.post('/', auth, ctrl.vote);
router.get('/:targetType/:targetId', optionalAuth, ctrl.getVoteStatus);

module.exports = router;
