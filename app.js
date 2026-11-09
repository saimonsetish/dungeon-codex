// Dungeon Codex - entry point.
// Wires together the view engine, middleware, routes and error handlers.
require('dotenv').config(); // load PORT and API_BASE_URL from .env

const path = require('path');
const express = require('express');
const logger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// --- View engine: EJS templates live in /views ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Middleware (order matters: it runs top to bottom) ---
app.use(logger);                                            // custom: logs every request
app.use(express.static(path.join(__dirname, 'public')));    // built-in: css, js, images
app.use(express.urlencoded({ extended: false }));           // built-in: parses HTML form bodies
app.use(express.json());                                    // built-in: parses JSON bodies

// Default values so every template can render without "undefined" errors.
app.use((req, res, next) => {
  res.locals.pageTitle = 'Dungeon Codex';
  res.locals.errors = [];
  res.locals.values = {};
  next();
});

// --- Routes ---
app.use('/', routes);

// --- Fallbacks (must come AFTER all routes) ---
app.use(notFound);      // 404 for unknown URLs
app.use(errorHandler);  // central error handler (err, req, res, next)

// Safety net: log unexpected async errors instead of crashing the server.
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));

// Only start listening when run directly (keeps the app importable for tests).
if (require.main === module) {
  app.listen(PORT, () => console.log(`Dungeon Codex running at http://localhost:${PORT}`));
}

module.exports = app;
