const express = require('express');
const OpenAiLocalRouter = require('./OpenAiLocalRouter');
const ThinkingKnobs = require('./ThinkingKnobs');
const ResponsesCompletion = require('./responses/ResponsesCompletion');
const ResponsesError = require('./responses/ResponsesError');
const ResponsesRequestTranslator = require('./responses/ResponsesRequestTranslator');
const ResponsesStream = require('./responses/ResponsesStream');

class OpenAiResponsesRouter {
  static JSON_LIMIT = '50mb';

  static create(deps = {}) {
    return new OpenAiResponsesRouter(deps).build();
  }

  constructor({ getUpstream, hostDial, warn } = {}) {
    if (typeof getUpstream !== 'function') throw new Error('OpenAiResponsesRouter: getUpstream is required');
    this._getUpstream = getUpstream;
    this._hostDial = hostDial;
    this._log = typeof warn === 'function' ? warn : (message) => console.warn('[local-api]', message);
    this._reportedTools = new Set();
  }

  build() {
    const router = express.Router();
    router.use(express.json({ limit: OpenAiResponsesRouter.JSON_LIMIT }));
    router.post('/v1/responses', (req, res) => this._responses(req, res));
    return router;
  }

  _responses(req, res) {
    const upstream = this._getUpstream();
    if (!upstream) return ResponsesError.send(res, 503, 'server_error', OpenAiLocalRouter.NO_MODEL_MESSAGE, { code: 'model_not_loaded' });
    const translated = ResponsesRequestTranslator.translate(OpenAiResponsesRouter._body(req), upstream.modelId);
    if (translated.error) return ResponsesError.send(res, 400, 'invalid_request_error', translated.error, { param: translated.param });
    this._reportDroppedTools(translated.dropped);
    const body = ThinkingKnobs.apply(translated.body, typeof this._hostDial === 'function' ? this._hostDial() : null);
    const Runner = body.stream ? ResponsesStream : ResponsesCompletion;
    return Runner.run({ res, upstream, body, log: this._log, context: translated.context });
  }

  _reportDroppedTools(types) {
    for (const type of types) {
      if (this._reportedTools.has(type)) continue;
      this._reportedTools.add(type);
      this._log(`responses: ignoring built-in tool type "${type}", which the local model cannot run`);
    }
  }

  static _body(req) {
    return (req.body && typeof req.body === 'object') ? req.body : {};
  }
}

module.exports = OpenAiResponsesRouter;
