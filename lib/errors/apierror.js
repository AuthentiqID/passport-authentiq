
function APIError(message) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'APIError';
    this.message = message;
    this.status = 500;
}

// Inherit from `Error`.
APIError.prototype.__proto__ = Error.prototype;


// Expose constructor.
module.exports = APIError;