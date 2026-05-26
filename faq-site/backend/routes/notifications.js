const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.get('/', auth, ctrl.getNotifications);
router.get('/unread-count', auth, ctrl.getUnreadCount);
router.put('/read', auth, ctrl.markAsRead);
router.put('/:id/archive', auth, ctrl.archiveNotification);

module.exports = router;
