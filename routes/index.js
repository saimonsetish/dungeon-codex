// Route definitions only: each line maps URL + method -> middleware -> controller.
const express = require('express');
const validateSearch = require('../middleware/validateSearch');
const searchController = require('../controllers/searchController');
const spellController = require('../controllers/spellController');
const monsterController = require('../controllers/monsterController');
const AppError = require('../utils/AppError');

const router = express.Router();

// Reject odd :index values (e.g. "../") before they reach the API URL.
const checkIndex = (req, res, next, value) => {
  if (!/^[a-z0-9-]+$/.test(value)) {
    return next(new AppError('That entry does not exist.', 404));
  }
  next();
};
router.param('index', checkIndex);

router.get('/', searchController.home);                          // home page + form
router.post('/search', validateSearch, searchController.search); // validate -> API -> results
router.get('/spells/:index', spellController.show);              // spell details
router.get('/monsters/:index', monsterController.show);          // monster details

module.exports = router;
