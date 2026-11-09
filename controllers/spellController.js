// GET /spells/:index - spell details page.
const dnd = require('../services/dndService');
const { formatSpell } = require('../utils/format');

async function show(req, res, next) {
  try {
    const spell = formatSpell(await dnd.getSpell(req.params.index));
    res.render('spell', { pageTitle: spell.name, spell });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
