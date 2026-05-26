const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.get('/dashboard', auth, adminOnly, ctrl.getDashboard);
router.get('/users', auth, adminOnly, ctrl.getUsers);
router.put('/users/:id/role', auth, adminOnly, ctrl.updateUserRole);
router.post('/users/:id/ban', auth, adminOnly, ctrl.banUser);
router.post('/users/:id/unban', auth, adminOnly, ctrl.unbanUser);
router.get('/flagged', auth, adminOnly, ctrl.getFlaggedContent);
router.post('/cache/clear', auth, adminOnly, ctrl.clearCache);

module.exports = router;
