const router = require('express').Router();
const ctrl = require('../controllers/searchController');

router.get('/', ctrl.search);
router.get('/suggestions', ctrl.getSuggestions);

module.exports = router;
