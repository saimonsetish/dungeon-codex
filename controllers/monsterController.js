// GET /monsters/:index - monster details page.
const dnd = require('../services/dndService');
const { formatMonster } = require('../utils/format');

async function show(req, res, next) {
  try {
    const monster = formatMonster(await dnd.getMonster(req.params.index));
    res.render('monster', { pageTitle: monster.name, monster });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
