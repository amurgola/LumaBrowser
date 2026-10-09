class IpcFailure {
  static of(message, fields = {}) {
    const failure = new Error(message);
    Object.assign(failure, fields);
    return failure;
  }

  static withCode(err) {
    return IpcFailure.of(err && err.message ? err.message : String(err), { code: (err && err.code) || null });
  }
}

module.exports = IpcFailure;
