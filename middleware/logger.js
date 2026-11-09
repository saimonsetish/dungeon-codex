// Custom middleware #1: request logger (method, URL, status, duration).
module.exports = function logger(req, res, next) {
  const start = Date.now();
  // 'finish' fires when the response has been sent, so we know the status code.
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
};
