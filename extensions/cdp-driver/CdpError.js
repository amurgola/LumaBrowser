class CdpError extends Error {
  static CODE = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    SERVER_ERROR: -32000,
  };

  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
  }

  static methodNotFound(method) {
    return new CdpError(CdpError.CODE.METHOD_NOT_FOUND, `'${method}' wasn't found`);
  }

  static invalidParams(message) { return new CdpError(CdpError.CODE.INVALID_PARAMS, message); }

  static invalidRequest(message) { return new CdpError(CdpError.CODE.INVALID_REQUEST, message); }

  static internal(message, data) { return new CdpError(CdpError.CODE.INTERNAL_ERROR, message, data); }

  static server(message, data) { return new CdpError(CdpError.CODE.SERVER_ERROR, message, data); }

  static serialize(err) {
    if (err instanceof CdpError) return CdpError._bodyOf(err);
    const message = err && err.message ? err.message : String(err);
    const code = err && typeof err.code === 'number' ? err.code : CdpError.CODE.SERVER_ERROR;
    return { code, message };
  }

  static _bodyOf(err) {
    const body = { code: err.code, message: err.message };
    if (err.data !== undefined) body.data = err.data;
    return body;
  }
}

module.exports = CdpError;
