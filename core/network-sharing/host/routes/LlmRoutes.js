const LlmModelGate = require('../llm/LlmModelGate');
const ChatCompletionTurn = require('../llm/ChatCompletionTurn');
const ResponsesTurn = require('../llm/ResponsesTurn');

class LlmRoutes {
  constructor(service, auth, { turns, agents }) {
    this._service = service;
    this._auth = auth;
    this._turns = turns;
    this._agents = agents;
  }

  mount(router) {
    const requireToken = this._auth.requireToken;
    router.get('/llm/v1/models', requireToken, async (req, res) => res.json(await LlmModelGate.modelList(this._service)));
    router.post('/llm/v1/chat/completions', requireToken, (req, res) => new ChatCompletionTurn(this._service, this._turns, this._agents).run(req, res));
    router.post('/llm/v1/chat/abort', requireToken, (req, res) => this._abort(req, res));
    router.post('/llm/v1/responses', requireToken, (req, res) => new ResponsesTurn(this._service, this._turns).run(req, res));
  }

  _abort(req, res) {
    const id = String((req.body && req.body.id) || '').trim();
    if (!this._turns.abort(id, req.sharingToken)) return res.status(404).json({ error: { message: 'no such turn' } });
    return res.json({ success: true, id });
  }
}

module.exports = LlmRoutes;
