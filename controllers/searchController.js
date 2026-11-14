// Handles the home page and the search (POST /search for the form, GET /search for pager links).
const dnd = require('../services/dndService');
const { formatSpell, formatMonster } = require('../utils/format');

const PAGE_SIZE = 12; // results per page = detail requests per search

// GET / - show the empty search form.
function home(req, res) {
  res.render('index', { pageTitle: 'Search the Codex', errors: [], values: { type: 'spell' } });
}

// Input was already validated by validateSearch, so req.search is clean.
async function search(req, res, next) {
  try {
    const query = req.search;
    return query.type === 'spell' ? await searchSpells(query, res) : await searchMonsters(query, res);
  } catch (err) {
    next(err); // hand over to the central error handler
  }
}

// Works out which slice of the full list belongs on this page.
function paginate(list, requestedPage) {
  const totalPages = Math.max(1, Math.ceil(list.count / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages); // a too-high page falls back to the last one
  const items = list.results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { page, totalPages, items };
}

// Builds the Previous/Next links, keeping the same filters in the URL.
function buildPager(query, page, totalPages) {
  const url = (p) => {
    const params = new URLSearchParams();
    const fields = { type: query.type, name: query.name, level: query.level, school: query.school, cr: query.cr, page: p };
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== '' && value != null) params.set(key, value);
    });
    return `/search?${params.toString()}`;
  };
  return {
    page,
    totalPages,
    prevUrl: page > 1 ? url(page - 1) : null,
    nextUrl: page < totalPages ? url(page + 1) : null,
  };
}

async function searchSpells(query, res) {
  const list = await dnd.searchSpells(query);                  // request 1: the full list (names only)
  const { page, totalPages, items } = paginate(list, query.page);
  const { details, failed } = await dnd.getDetails('spell', items, PAGE_SIZE); // request 2: details for this page
  const spells = details.map(formatSpell);

  // Sort by level, then by name.
  spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  // Group by school of magic: array of { school, slug, spells } sorted by school name.
  const bySchool = new Map();
  spells.forEach((s) => {
    if (!bySchool.has(s.school)) bySchool.set(s.school, { school: s.school, slug: s.schoolSlug, spells: [] });
    bySchool.get(s.school).spells.push(s);
  });
  const groups = [...bySchool.values()].sort((a, b) => a.school.localeCompare(b.school));

  res.render('results', {
    pageTitle: 'Spell results',
    type: 'spell', query, total: list.count, shown: spells.length, failed, groups, monsters: [], stats: null,
    pager: buildPager(query, page, totalPages),
  });
}

async function searchMonsters(query, res) {
  const list = await dnd.searchMonsters(query);
  const { page, totalPages, items } = paginate(list, query.page);
  const { details, failed } = await dnd.getDetails('monster', items, PAGE_SIZE);
  const monsters = details.map(formatMonster);

  // Sort by challenge rating, then by name.
  monsters.sort((a, b) => a.cr - b.cr || a.name.localeCompare(b.name));

  // Calculated stats for the monsters on this page (shown above the cards).
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
    pager: buildPager(query, page, totalPages),
  });
}

module.exports = { home, search };
