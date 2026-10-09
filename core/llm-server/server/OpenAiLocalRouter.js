const express = require('express');
const ThinkingKnobs = require('./ThinkingKnobs');
const UpstreamProxy = require('./UpstreamProxy');
const OpenAiModelList = require('./OpenAiModelList');

class OpenAiLocalRouter {
  static NO_MODEL_MESSAGE = 'No chat model is loaded. Open the LLM tab and start one.';

  static JSON_LIMIT = '50mb';

  static create(deps = {}) {
    return new OpenAiLocalRouter(deps).build();
  }

  constructor({ getUpstream, listModels, hostDial, warn, getThinking } = {}) {
    if (typeof getUpstream !== 'function') throw new Error('OpenAiLocalRouter: getUpstream is required');
    this._getUpstream = getUpstream;
    this._listModels = listModels;
    this._hostDial = hostDial;
    this._getThinking = getThinking;
    this._log = typeof warn === 'function' ? warn : (message) => console.warn('[local-api]', message);
  }

  build() {
    const router = express.Router();
    router.use(express.json({ limit: OpenAiLocalRouter.JSON_LIMIT }));
    router.get('/', (req, res) => this._info(res));
    router.get('/health', (req, res) => this._health(res));
    router.get('/v1/models', (req, res) => this._models(res));
    router.get('/v1/models/:id', (req, res) => res.json(OpenAiModelList.single(req.params.id, this._getUpstream())));
    router.post('/v1/chat/completions', (req, res) => this._forward(req, res, '/v1/chat/completions', true));
    router.post('/v1/completions', (req, res) => this._forward(req, res, '/v1/completions', false));
    router.post('/v1/embeddings', (req, res) => this._forward(req, res, '/v1/embeddings', false));
    return router;
  }

  _info(res) {
    const upstream = this._getUpstream();
    res.json({ name: 'LumaBrowser local API', openai_base_url: '/v1', model_loaded: !!upstream, model: upstream ? upstream.modelId : null });
  }

  _health(res) {
    const upstream = this._getUpstream();
    res.status(upstream ? 200 : 503).json({ status: upstream ? 'ok' : 'no model loaded', model: upstream ? upstream.modelId : null });
  }

  async _models(res) {
    const upstream = this._getUpstream();
    res.json(OpenAiModelList.build(await this._installedModels(), upstream));
  }

  async _installedModels() {
    if (typeof this._listModels !== 'function') return [];
    try {
      return (await this._listModels()) || [];
    } catch (error) {
      this._log(`models list failed: ${error && error.message}`);
      return [];
    }
  }

  _forward(req, res, path, chat) {
    const upstream = this._getUpstream();
    if (!upstream) return OpenAiLocalRouter._noModel(res);
    const body = (req.body && typeof req.body === 'object') ? { ...req.body } : {};
    if (chat && !this._prepareChat(body, upstream, res)) return undefined;
    body.model = upstream.modelId;
    return UpstreamProxy.forward({ req, res, upstream, path, body, log: this._log });
  }

  _prepareChat(body, upstream, res) {
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({ error: { message: 'messages is required', type: 'invalid_request_error' } });
      return false;
    }
    ThinkingKnobs.apply(body, typeof this._hostDial === 'function' ? this._hostDial() : null);
    const refusal = ThinkingKnobs.refusal(body, this._thinkingFor(upstream));
    if (!refusal) return true;
    res.status(400).json({ error: { message: refusal.message, type: 'invalid_request_error', code: refusal.code } });
    return false;
  }

  _thinkingFor(upstream) {
    try {
      return typeof this._getThinking === 'function' ? this._getThinking() : (upstream.thinking || null);
    } catch (_) {
      return null;
    }
  }

  static _noModel(res) {
    res.status(503).json({ error: { message: OpenAiLocalRouter.NO_MODEL_MESSAGE, type: 'server_error', code: 'model_not_loaded' } });
  }
}

module.exports = OpenAiLocalRouter;
