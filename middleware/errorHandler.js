// 404 handler + central error handler.

// Runs when no route matched the request.
function notFound(req, res) {
  res.status(404).render('error', {
    pageTitle: 'Not found',
    status: 404,
    message: 'That page does not exist. Check the address or go back to the search.',
  });
}

// Express recognises an error handler by its 4 arguments (err, req, res, next).
function errorHandler(err, req, res, next) {
  // Technical details go to the console only, never to the user.
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.stack || err);

  if (res.headersSent) return next(err);

  const status = err.status || 500;
  // Only AppError messages are written for users; other errors get a generic message.
  let message;
  if (err.name === 'AppError') {
    message = err.message;
  } else if (status >= 400 && status < 500) {
    message = 'The request could not be understood. Please check it and try again.'; // e.g. malformed JSON body
  } else {
    message = 'Something went wrong on our side. Please try again in a moment.';
  }

  res.status(status).render('error', { pageTitle: 'Error', status, message });
}

module.exports = { notFound, errorHandler };
