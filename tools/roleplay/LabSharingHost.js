const http = require('http');
const path = require('path');

class LabSharingHost {
  static CONFIG_ID = 'peer:lab:llm';
  static CORE = path.join(__dirname, '..', '..', 'core');

  constructor({ router, modelRef, effort = 'default' }) {
    this._router = router;
    this._modelRef = modelRef;
    this._effort = effort;
    this._server = null;
    this.requests = [];
  }

  async start() {
    const app = this._app();
    this._server = http.createServer(app);
    await new Promise((resolve, reject) => {
      this._server.once('error', reject);
      this._server.listen(0, '127.0.0.1', resolve);
    });
    return this.endpoint();
  }

  endpoint() {
    return 'http://127.0.0.1:' + this._server.address().port + '/sharing/llm';
  }

  providerConfig(contextWindow) {
    return {
      id: LabSharingHost.CONFIG_ID,
      name: 'Lab host (shared)',
      type: 'openai',
      endpoint: this.endpoint(),
      apiKey: 'lab',
      selectedModel: this._modelRef,
      models: [{ id: this._modelRef, luma_label: this._modelRef, luma_kind: 'local', luma_context: contextWindow }],
      peerId: 'lab',
      peerManaged: true,
    };
  }

  clientRef() {
    return LabSharingHost.CONFIG_ID + '::' + this._modelRef;
  }

  async stop() {
    if (!this._server) return;
    const server = this._server;
    this._server = null;
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    await new Promise((resolve) => server.close(() => resolve()));
  }

  _app() {
    const express = require('express');
    const ChatCompletionTurn = require(path.join(LabSharingHost.CORE, 'network-sharing/host/llm/ChatCompletionTurn'));
    const LiveTurnRegistry = require(path.join(LabSharingHost.CORE, 'network-sharing/host/llm/LiveTurnRegistry'));
    const turns = new LiveTurnRegistry();
    const service = this._service();
    const app = express();
    app.use(express.json({ limit: '64mb' }));
    app.post('/sharing/llm/v1/chat/completions', (req, res) => {
      req.sharingToken = { id: 'lab' };
      this.requests.push(LabSharingHost.wireSummary(req.body));
      return new ChatCompletionTurn(service, turns, null).run(req, res);
    });
    app.post('/sharing/llm/v1/chat/abort', (req, res) => {
      const ok = turns.abort(String((req.body && req.body.id) || '').trim(), { id: 'lab' });
      return ok ? res.json({ success: true }) : res.status(404).json({ error: { message: 'no such turn' } });
    });
    return app;
  }

  _service() {
    return {
      hostDialPosition: () => this._effort,
      getChatRouter: () => this._router,
      getWebAllowedTools: () => null,
      allowedLlmRefs: async () => new Set([this._modelRef]),
      recordUsage: () => {},
    };
  }

  static wireSummary(body) {
    const b = body || {};
    const { messages, ...fields } = b;
    const list = Array.isArray(messages) ? messages : [];
    const chars = list.reduce((sum, m) => sum + (typeof (m && m.content) === 'string' ? m.content.length : 0), 0);
    return { fields, messages: list.length, chars };
  }
}

module.exports = LabSharingHost;
