const router = require('express').Router();
const { auth, optionalAuth, moderatorOrAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/faqController');

router.get('/', ctrl.getFAQs);
router.get('/:slug', ctrl.getFAQBySlug);
router.post('/', auth, moderatorOrAdmin, ctrl.createFAQ);
router.put('/:id', auth, moderatorOrAdmin, ctrl.updateFAQ);
router.delete('/:id', auth, moderatorOrAdmin, ctrl.deleteFAQ);

router.post('/:id/items', auth, moderatorOrAdmin, ctrl.addFAQItem);
router.put('/:id/items/:itemId', auth, moderatorOrAdmin, ctrl.updateFAQItem);
router.delete('/:id/items/:itemId', auth, moderatorOrAdmin, ctrl.deleteFAQItem);
router.post('/:id/items/:itemId/feedback', optionalAuth, ctrl.markFAQHelpful);

module.exports = router;
