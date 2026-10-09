class WatcherInput {
  static ENABLED_NOT_BOOLEAN = 'enabled field must be a boolean';

  static missingField(body, field) {
    if (!body || !body[field]) return WatcherInput._missingMessage(field);
    return null;
  }

  static idError(id) {
    if (typeof id !== 'string' || !id.trim()) return WatcherInput._missingMessage('id');
    return null;
  }

  static enabledError(enabled) {
    return typeof enabled === 'boolean' ? null : WatcherInput.ENABLED_NOT_BOOLEAN;
  }

  static _missingMessage(field) {
    return `Missing required field: ${field} is required`;
  }
}

module.exports = WatcherInput;
