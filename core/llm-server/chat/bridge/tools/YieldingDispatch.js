class YieldingDispatch {
  constructor({ dispatch, ctx, slowCalls = null }) {
    this._dispatch = dispatch;
    this._ctx = ctx;
    this._slowCalls = slowCalls;
  }

  async dispatch(name, params, browserService) {
    const detached = this._ctx.detached || null;
    if (!this._slowCalls || !detached || !this._slowCalls.covers(name, detached.kindOf(name))) {
      return this._dispatch.dispatch(name, params, browserService);
    }
    return this._slowCalls.settle({ tool: name, params, call: detached.begin(name, params), ctx: this._ctx });
  }
}

module.exports = YieldingDispatch;
