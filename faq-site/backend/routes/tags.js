const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/tagController');

router.get('/', ctrl.getTags);
router.get('/:name', ctrl.getTag);
router.post('/', auth, adminOnly, ctrl.createTag);
router.put('/:id', auth, adminOnly, ctrl.updateTag);

module.exports = router;
