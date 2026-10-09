class RuntimeInstallError extends Error {
  constructor(message, code, detail) {
    super(message);
    this.code = code;
    if (detail !== undefined) this.detail = detail;
  }
}

module.exports = RuntimeInstallError;
