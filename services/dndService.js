// Service layer: the ONLY file that talks to the D&D 5e API (via Axios).
// Controllers call these functions and never use Axios directly.
const axios = require('axios');
const AppError = require('../utils/AppError');

const BASE_URL = process.env.API_BASE_URL || 'https://www.dnd5eapi.co';

// One preconfigured Axios instance: base URL + timeout so a slow API cannot hang us.
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

// Tiny in-memory cache (URL + params -> data) so repeated searches skip the network.
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

// Turns any Axios failure into an AppError with a friendly message.
function toAppError(err, url) {
  console.error(`[api] request to ${url} failed:`, err.code || '', err.response?.status || '', err.message);

  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    return new AppError('The D&D API took too long to respond. Please try again.', 504);
  }
  if (!err.response) { // no response at all = network problem / API unreachable
    return new AppError('Could not reach the D&D API. Check your connection and try again.', 502);
  }
  const status = err.response.status;
  if (status === 404) return new AppError('The API has no entry with that name.', 404);
  if (status === 429) return new AppError('Too many requests to the D&D API. Wait a minute and try again.', 503);
  if (status >= 500) return new AppError('The D&D API is having problems right now. Try again later.', 502);
  return new AppError('The D&D API rejected the request.', 502);
}

// Generic GET with caching and error translation.
async function get(url, params = {}) {
  const key = `${url}?${new URLSearchParams(params).toString()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < CACHE_TTL_MS) return hit.data;

  try {
    const response = await client.get(url, { params });
    cache.set(key, { time: Date.now(), data: response.data });
    return response.data;
  } catch (err) {
    throw toAppError(err, url);
  }
}

// Removes empty filters so we never send "?name=&level=".
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

// API request type 1: list endpoints with filters (returns { count, results: [{index, name, url}] }).
const searchSpells = ({ name, level }) => get('/api/spells', clean({ name, level }));
const searchMonsters = ({ name, cr }) => get('/api/monsters', clean({ name, challenge_rating: cr }));

// API request type 2: detail endpoints.
const getSpell = (index) => get(`/api/spells/${index}`);
const getMonster = (index) => get(`/api/monsters/${index}`);

// List endpoints only return names, so we fetch details for the first `limit` items in parallel.
// Promise.allSettled means one failed request does not break the whole page.
async function getDetails(kind, items, limit = 12) {
  const fetcher = kind === 'spell' ? getSpell : getMonster;
  const settled = await Promise.allSettled(items.slice(0, limit).map((item) => fetcher(item.index)));
  const details = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  return { details, failed: settled.length - details.length };
}

module.exports = { BASE_URL, searchSpells, searchMonsters, getSpell, getMonster, getDetails };
