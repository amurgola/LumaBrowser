class LaunchErrorHints {
  static START_FAILED = 'Failed to start the local server.';

  static of(err) {
    if (!err) return {};
    const out = {};
    if (err.code) out.code = err.code;
    if (err.runtimeId) out.runtimeId = err.runtimeId;
    if (err.runtimeName) out.runtimeName = err.runtimeName;
    if (typeof err.installable === 'boolean') out.installable = err.installable;
    return out;
  }

  static failureFrom(err) {
    return {
      success: false,
      error: (err && err.message) || LaunchErrorHints.START_FAILED,
      code: err && err.code,
      runtimeId: err && err.runtimeId,
      runtimeName: err && err.runtimeName,
      installable: err && err.installable,
    };
  }

  static errorFrom(result) {
    const error = new Error((result && result.error) || LaunchErrorHints.START_FAILED);
    return Object.assign(error, LaunchErrorHints.of(result));
  }
}

module.exports = LaunchErrorHints;
