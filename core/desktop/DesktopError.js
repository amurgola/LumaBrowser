class DesktopError extends Error {
  static HUMAN_NEEDED = 'HUMAN_NEEDED';
  static COVERED = 'COVERED';
  static REFUSED = 'REFUSED';
  static FOREGROUND_CHANGED = 'FOREGROUND_CHANGED';
  static STOPPED = 'STOPPED';

  constructor(message, code) {
    super(message);
    this.code = code;
  }

  static toResult(error) {
    const message = (error && error.message) || String(error);
    return { success: false, error: message, ...(error && error.code ? { code: error.code } : {}) };
  }
}

module.exports = DesktopError;
