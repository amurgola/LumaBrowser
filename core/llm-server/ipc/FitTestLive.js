class FitTestLive {
  constructor(modelPath) {
    this.running = true;
    this.modelPath = modelPath;
    this.runtime = null;
    this.hardware = null;
    this.total = 0;
    this.index = 0;
    this.combo = null;
    this.results = [];
    this.chatServer = null;
  }

  apply(msg) {
    if (!msg) return;
    if (typeof msg.total === 'number') this.total = msg.total;
    if (typeof msg.index === 'number') this.index = msg.index;
    if (msg.combo) this.combo = msg.combo;
    if (msg.phase === 'combo-done' && msg.result) this._replaceResult(msg.result);
  }

  noteChatServer(payload) {
    this.chatServer = payload || null;
  }

  _replaceResult(result) {
    this.results = this.results.filter((r) => !(r.contextTokens === result.contextTokens && r.kv === result.kv));
    this.results.push(result);
  }
}

module.exports = FitTestLive;
