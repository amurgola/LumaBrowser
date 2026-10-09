class WebDriverError extends Error {
  static TABLE = {
    elementClickIntercepted: { status: 400, code: 'element click intercepted' },
    elementNotInteractable: { status: 400, code: 'element not interactable' },
    insecureCertificate: { status: 400, code: 'insecure certificate' },
    invalidArgument: { status: 400, code: 'invalid argument' },
    invalidCookieDomain: { status: 400, code: 'invalid cookie domain' },
    invalidElementState: { status: 400, code: 'invalid element state' },
    invalidSelector: { status: 400, code: 'invalid selector' },
    invalidSessionId: { status: 404, code: 'invalid session id' },
    javascriptError: { status: 500, code: 'javascript error' },
    moveTargetOutOfBounds: { status: 500, code: 'move target out of bounds' },
    noSuchAlert: { status: 404, code: 'no such alert' },
    noSuchCookie: { status: 404, code: 'no such cookie' },
    noSuchElement: { status: 404, code: 'no such element' },
    noSuchFrame: { status: 404, code: 'no such frame' },
    noSuchWindow: { status: 404, code: 'no such window' },
    noSuchShadowRoot: { status: 404, code: 'no such shadow root' },
    detachedShadowRoot: { status: 404, code: 'detached shadow root' },
    staleElementReference: { status: 404, code: 'stale element reference' },
    scriptTimeout: { status: 500, code: 'script timeout' },
    sessionNotCreated: { status: 500, code: 'session not created' },
    timeout: { status: 500, code: 'timeout' },
    unableToSetCookie: { status: 500, code: 'unable to set cookie' },
    unableToCaptureScreen: { status: 500, code: 'unable to capture screen' },
    unexpectedAlertOpen: { status: 500, code: 'unexpected alert open' },
    unknownCommand: { status: 404, code: 'unknown command' },
    unknownError: { status: 500, code: 'unknown error' },
    unknownMethod: { status: 405, code: 'unknown method' },
    unsupportedOperation: { status: 500, code: 'unsupported operation' },
  };

  static {
    for (const name of Object.keys(WebDriverError.TABLE)) {
      WebDriverError[name] = (message, data) => new WebDriverError(name, message, data);
    }
  }

  constructor(name, message, data) {
    const entry = WebDriverError.TABLE[name] || WebDriverError.TABLE.unknownError;
    super(message || entry.code);
    this.name = 'WebDriverError';
    this.wdName = name;
    this.wdCode = entry.code;
    this.httpStatus = entry.status;
    this.data = data;
  }

  static serialize(err) {
    const wdErr = err instanceof WebDriverError ? err : WebDriverError.unknownError(err && err.message ? err.message : String(err));
    const value = { error: wdErr.wdCode, message: wdErr.message, stacktrace: (err && err.stack) || '' };
    if (wdErr.data !== undefined) value.data = wdErr.data;
    return { status: wdErr.httpStatus, body: { value } };
  }
}

module.exports = WebDriverError;
