const FinalTextResolver = require('./FinalTextResolver');

class TurnFinisher {
  constructor(o) {
    this._o = o;
    this._hooks = o.hooks;
  }

  async finish({ result, runError }) {
    this._reportUsage();
    if (runError) return this._fail(runError);
    if (this._o.isAborted()) return this._stopped();
    if (result.error && !result.finalResponse) return this._fail(new Error(result.error === 'aborted' ? 'stopped' : result.error));
    return this._complete(result);
  }

  async _complete(result) {
    const o = this._o;
    const text = FinalTextResolver.resolve({ result, trace: o.trace, artifacts: o.artifacts, groups: o.groups, hooks: this._hooks });
    this._persistTrace();
    await o.mirror.settleFinal(text, o.isAborted);
    this._hooks.onDone(o.health.doneFields(result));
    o.closeWork();
  }

  _fail(error) {
    this._persistTrace();
    this._hooks.onError(error);
    this._o.closeWork();
  }

  _stopped() {
    this._persistTrace();
    this._hooks.onDone({ finishReason: 'stop', aborted: true });
    this._o.closeWork();
  }

  _reportUsage() {
    const usage = this._o.health.lastUsage;
    if (!usage || !this._hooks.onUsage) return;
    try { this._hooks.onUsage(usage); } catch (_) {}
  }

  _persistTrace() {
    const { trace, artifacts } = this._o;
    if (this._hooks.onToolTrace && (trace.length || artifacts.length)) {
      this._hooks.onToolTrace({ tools: trace.entries, artifacts });
    }
  }
}

module.exports = TurnFinisher;
