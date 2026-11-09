# Dungeon Codex

A server-side web app for Dungeons & Dragons 5e players and game masters. Search spells and monsters by name, spell level or challenge rating instead of paging through the rulebooks.

Built for **VR 113153 Web Development II** (Individual Project) with Express, Node.js, Axios and EJS.

## API used

[D&D 5e API](https://www.dnd5eapi.co) (free, no API key). Docs: https://5e-bits.github.io/docs/

| Request | Purpose |
|---|---|
| `GET /api/spells?level={n}&name={text}` | filtered list of spells |
| `GET /api/spells/{index}` | spell details |
| `GET /api/monsters?challenge_rating={n}&name={text}` | filtered list of monsters |
| `GET /api/monsters/{index}` | monster details (HP, AC, abilities, image) |

## Features

- Search spells (by level and/or name) or monsters (by challenge rating and/or name)
- Server-side validation with clear messages (empty form, level outside 0-9, invalid challenge rating, unsafe characters)
- Spells are sorted by level and grouped by school of magic
- Monsters are sorted by challenge rating; average HP and AC of the results are calculated
- Detail pages: spell description and components, monster stat block with ability modifiers
- "No results" state, partial-failure notice and a friendly error page for timeouts, network errors, 404, 429 and 5xx from the API
- Small in-memory cache so repeated searches do not call the API again
- Responsive layout (mobile and desktop), keyboard-friendly, no framework

## Routes

| Method | Path | Description |
|---|---|---|
| GET | `/` | Home page with the search form |
| POST | `/search` | Validates input, calls the API, shows the results list |
| GET | `/spells/:index` | Spell details |
| GET | `/monsters/:index` | Monster details |
| any | `*` | 404 page |

## Project structure

```
app.js                      entry point, middleware order, error handlers
routes/index.js             URL -> middleware -> controller
controllers/                request handling and data processing
services/dndService.js      all Axios calls, cache, error translation
middleware/                 logger, validateSearch, errorHandler (+404)
utils/                      AppError class, formatting helpers
views/ (+ partials/)        EJS templates
public/                     css and client script
```

## Installation

Requires Node.js 18 or newer.

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm start
```

Open http://localhost:3000. `.env` holds `PORT` and `API_BASE_URL`; no API key is needed.

## Screenshots

_Add 2-3 screenshots here (home page, results, monster detail)._

## Credits

- Data: D&D 5e API (SRD content under the Open Game License)
- Fonts: Alegreya and Alegreya Sans (Google Fonts)
- AI assistance (Claude) is described in `docs/AI_DECLARATION.md`
