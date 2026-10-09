class ActivityLogCallerLogger {
  constructor(service, caller) {
    this._service = service;
    this.caller = caller;
  }

  log = (entry) => this._service.log(this._withCaller(entry));

  span = (entry, fn) => this._service.span(this._withCaller(entry), fn);

  startSpan = (entry) => this._service.startSpan(this._withCaller(entry));

  finishSpan = (handle, patch) => this._service.finishSpan(handle, patch);

  isEnabled = () => this._service.isEnabled(this.caller);

  info = (message, details) => this._message('info', message, details);

  warn = (message, details) => this._message('warn', message, details);

  error = (message, details) => this._message('error', message, details);

  debug = (message, details) => this._message('debug', message, details);

  _withCaller(entry) {
    return { ...entry, caller: entry?.caller ?? this.caller };
  }

  _message(result, message, details) {
    return this._service.log({
      caller: this.caller,
      action: 'message',
      result,
      summary: String(message),
      details: details ?? null,
    });
  }
}

module.exports = ActivityLogCallerLogger;
