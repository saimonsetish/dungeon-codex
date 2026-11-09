// Pure helper functions that turn raw API JSON into small objects the views can use.
const { BASE_URL } = require('../services/dndService');

// 0.125 -> "1/8", 0.25 -> "1/4", 0.5 -> "1/2", 5 -> "5"
function formatCr(cr) {
  const fractions = { 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' };
  return fractions[cr] || String(cr);
}

// D&D rule: modifier = floor((score - 10) / 2). Shown with a sign, e.g. +3 or -1.
function abilityMod(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

// 0 -> "Cantrip", 3 -> "Level 3"
const levelLabel = (level) => (level === 0 ? 'Cantrip' : `Level ${level}`);

// "Evocation" -> "evocation" (used for CSS colour classes)
const slug = (text) => String(text || '').toLowerCase().replace(/[^a-z]/g, '');

// Armor class is an array in newer API versions and a number in older ones.
function armorClass(ac) {
  if (Array.isArray(ac)) return ac[0] ? ac[0].value : null;
  return typeof ac === 'number' ? ac : null;
}

// The API returns image paths like "/api/images/monsters/aboleth.png".
const imageUrl = (path) => (path ? `${BASE_URL}${path}` : null);

// "passive_perception" -> "passive perception"
const words = (key) => key.replace(/_/g, ' ');

// ----- Spells -----
function formatSpell(spell) {
  return {
    index: spell.index,
    name: spell.name,
    level: spell.level,
    levelLabel: levelLabel(spell.level),
    school: spell.school ? spell.school.name : 'Unknown',
    schoolSlug: slug(spell.school && spell.school.name),
    range: spell.range,
    castingTime: spell.casting_time,
    duration: spell.duration,
    concentration: Boolean(spell.concentration),
    ritual: Boolean(spell.ritual),
    components: spell.components || [],
    material: spell.material || null,
    classes: (spell.classes || []).map((c) => c.name),
    description: spell.desc || [],
    higherLevel: spell.higher_level || [],
  };
}

// ----- Monsters -----
function formatMonster(m) {
  return {
    index: m.index,
    name: m.name,
    size: m.size,
    type: m.type,
    alignment: m.alignment,
    cr: m.challenge_rating,
    crLabel: formatCr(m.challenge_rating),
    xp: m.xp,
    hp: m.hit_points,
    hitDice: m.hit_dice,
    ac: armorClass(m.armor_class),
    image: imageUrl(m.image),
    speed: Object.entries(m.speed || {}).map(([k, v]) => ({ label: words(k), value: v })),
    abilities: [
      ['STR', m.strength], ['DEX', m.dexterity], ['CON', m.constitution],
      ['INT', m.intelligence], ['WIS', m.wisdom], ['CHA', m.charisma],
    ].map(([label, score]) => ({ label, score, mod: abilityMod(score) })),
    senses: Object.entries(m.senses || {}).map(([k, v]) => ({ label: words(k), value: v })),
    languages: m.languages || '',
    specialAbilities: m.special_abilities || [],
    actions: m.actions || [],
    legendaryActions: m.legendary_actions || [],
  };
}

module.exports = { formatCr, abilityMod, formatSpell, formatMonster, levelLabel };
