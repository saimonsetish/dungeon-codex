// Custom middleware #2: validates the search form BEFORE any API call is made.
// On success it stores clean values in req.search; on failure it re-renders the form.

// Challenge ratings that exist in D&D 5e (fractions are written as decimals in the API).
const VALID_CR = new Set(['0', '0.125', '0.25', '0.5', ...Array.from({ length: 30 }, (_, i) => String(i + 1))]);
const CR_FRACTIONS = { '1/8': '0.125', '1/4': '0.25', '1/2': '0.5' };

// The eight schools of magic (values sent to the API's ?school= filter).
const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];

module.exports = function validateSearch(req, res, next) {
  const type = String(req.body.type || '').trim();
  const name = String(req.body.name || '').trim();
  const level = String(req.body.level || '').trim();
  const crRaw = String(req.body.cr || '').trim();
  const school = String(req.body.school || '').trim();
  const errors = [];

  if (!['spell', 'monster'].includes(type)) {
    errors.push('Choose whether to search spells or monsters.');
  }

  // Name: optional, but only letters, digits, spaces, apostrophes and hyphens, max 50 chars.
  if (name.length > 50) {
    errors.push('Name must be 50 characters or fewer.');
  } else if (name && !/^[\p{L}0-9 '\-]+$/u.test(name)) {
    errors.push("Name can contain only letters, numbers, spaces, apostrophes and hyphens.");
  }

  // Spell level: a whole number 0-9 (0 = cantrip).
  if (type === 'spell' && level !== '' && !/^[0-9]$/.test(level)) {
    errors.push('Spell level must be a whole number from 0 (cantrip) to 9.');
  }

  // School of magic (spells only): empty means "any school", otherwise it must be in our list.
  if (type === 'spell' && school !== '' && !SCHOOLS.includes(school)) {
    errors.push('Choose a school of magic from the list.');
  }

  // Challenge rating: accept 1/8, 1/4, 1/2 or a number 0-30.
  let cr = '';
  if (type === 'monster' && crRaw !== '') {
    cr = CR_FRACTIONS[crRaw] || (isNaN(Number(crRaw)) ? crRaw : String(Number(crRaw)));
    if (!VALID_CR.has(cr)) {
      errors.push('Challenge rating must be 0, 1/8, 1/4, 1/2 or a whole number from 1 to 30.');
    }
  }

  // At least one filter is needed, otherwise we would request the whole database.
  const filter = type === 'spell' ? level + school : crRaw;
  if (['spell', 'monster'].includes(type) && !name && filter === '') {
    errors.push(type === 'spell'
      ? 'Enter a spell name, a spell level or a school of magic.'
      : 'Enter a monster name or a challenge rating.');
  }

  if (errors.length) {
    // 400 = bad request. Keep what the user typed so they can fix it.
    return res.status(400).render('index', {
      pageTitle: 'Search the Codex',
      errors,
      values: { type, name, level, school, cr: crRaw },
    });
  }

  req.search = { type, name, level: type === 'spell' ? level : '', school: type === 'spell' ? school : '', cr: type === 'monster' ? cr : '' };
  next();
};
