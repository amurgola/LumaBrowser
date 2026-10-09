class ActivityLogSpanContext {
  static NOOP = Object.freeze({
    log: () => null,
    span: async (_entry, fn) => fn(ActivityLogSpanContext.NOOP),
    update: () => {},
    correlation: null,
    parentId: null,
  });

  constructor(service, handle) {
    this._service = service;
    this._handle = handle;
    this._final = { result: undefined, summary: undefined, details: undefined };
    this.correlation = handle.correlation;
    this.parentId = handle.id;
  }

  log = (child) => this._service.log(this._nest(child));

  span = (child, fn) => this._service.span(this._nest(child), fn);

  update = (patch = {}) => {
    for (const field of Object.keys(this._final)) {
      if (patch[field] !== undefined) this._final[field] = patch[field];
    }
  };

  finalPatch() {
    return { ...this._final };
  }

  _nest(child) {
    return {
      ...child,
      caller: child.caller ?? this._handle.caller,
      correlation: child.correlation ?? this._handle.correlation,
      parentId: child.parentId ?? this._handle.id,
    };
  }
}

module.exports = ActivityLogSpanContext;
