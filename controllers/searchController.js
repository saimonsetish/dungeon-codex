// Handles the home page and the search form (POST /search).
const dnd = require('../services/dndService');
const { formatSpell, formatMonster } = require('../utils/format');

const MAX_RESULTS = 12; // how many detail requests we make per search

// GET / - show the empty search form.
function home(req, res) {
  res.render('index', { pageTitle: 'Search the Codex', errors: [], values: { type: 'spell' } });
}

// POST /search - input was already validated by validateSearch, so req.search is clean.
async function search(req, res, next) {
  try {
    const query = req.search;
    return query.type === 'spell' ? await searchSpells(query, res) : await searchMonsters(query, res);
  } catch (err) {
    next(err); // hand over to the central error handler
  }
}

async function searchSpells(query, res) {
  const list = await dnd.searchSpells(query);                           // request 1: the list
  const { details, failed } = await dnd.getDetails('spell', list.results, MAX_RESULTS); // request 2: details
  const spells = details.map(formatSpell);

  // Sort by level, then by name.
  spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  // Group by school of magic: { Evocation: [...], Abjuration: [...] } -> array sorted by school.
  const bySchool = new Map();
  spells.forEach((s) => {
    if (!bySchool.has(s.school)) bySchool.set(s.school, { school: s.school, slug: s.schoolSlug, spells: [] });
    bySchool.get(s.school).spells.push(s);
  });
  const groups = [...bySchool.values()].sort((a, b) => a.school.localeCompare(b.school));

  res.render('results', {
    pageTitle: 'Spell results',
    type: 'spell', query, total: list.count, shown: spells.length, failed, groups, monsters: [], stats: null,
  });
}

async function searchMonsters(query, res) {
  const list = await dnd.searchMonsters(query);
  const { details, failed } = await dnd.getDetails('monster', list.results, MAX_RESULTS);
  const monsters = details.map(formatMonster);

  // Sort by challenge rating, then by name.
  monsters.sort((a, b) => a.cr - b.cr || a.name.localeCompare(b.name));

  // Calculated stats for the results (shown above the cards).
  let stats = null;
  if (monsters.length) {
    const avg = (arr) => arr.reduce((sum, n) => sum + n, 0) / arr.length;
    const acs = monsters.map((m) => m.ac).filter((n) => n != null);
    stats = {
      avgHp: Math.round(avg(monsters.map((m) => m.hp))),
      avgAc: acs.length ? avg(acs).toFixed(1) : 'n/a',
      strongest: monsters[monsters.length - 1],
    };
  }

  res.render('results', {
    pageTitle: 'Monster results',
    type: 'monster', query, total: list.count, shown: monsters.length, failed, groups: [], monsters, stats,
  });
}

module.exports = { home, search };
