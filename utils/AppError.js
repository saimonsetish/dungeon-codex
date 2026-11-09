// An error that carries an HTTP status and a message that is safe to show users.
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}
module.exports = AppError;
