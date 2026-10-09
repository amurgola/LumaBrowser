class ApiResponse {
  constructor(success = true, data = null, error = null, message = null) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success(data = null, message = null) {
    return new ApiResponse(true, data, null, message);
  }

  static error(error, message = null) {
    return new ApiResponse(false, null, error, message);
  }

  toJSON() {
    const response = { success: this.success, timestamp: this.timestamp };
    for (const field of ['data', 'error', 'message']) {
      if (this[field] !== null) response[field] = this[field];
    }
    return response;
  }
}

module.exports = ApiResponse;
