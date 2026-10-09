const express = require('express');
const OpenAiLocalRouter = require('./OpenAiLocalRouter');
const ThinkingKnobs = require('./ThinkingKnobs');
const AnthropicError = require('./anthropic/AnthropicError');
const MessagesCompletion = require('./anthropic/MessagesCompletion');
const MessagesRequestTranslator = require('./anthropic/MessagesRequestTranslator');
const MessagesStream = require('./anthropic/MessagesStream');
const MessagesTokenCount = require('./anthropic/MessagesTokenCount');

class AnthropicMessagesRouter {
  static JSON_LIMIT = '50mb';

  static create(deps = {}) {
    return new AnthropicMessagesRouter(deps).build();
  }

  constructor({ getUpstream, hostDial, warn } = {}) {
    if (typeof getUpstream !== 'function') throw new Error('AnthropicMessagesRouter: getUpstream is required');
    this._getUpstream = getUpstream;
    this._hostDial = hostDial;
    this._log = typeof warn === 'function' ? warn : (message) => console.warn('[local-api]', message);
  }

  build() {
    const router = express.Router();
    router.use(express.json({ limit: AnthropicMessagesRouter.JSON_LIMIT }));
    router.post('/v1/messages/count_tokens', (req, res) => res.json({ input_tokens: MessagesTokenCount.estimate(AnthropicMessagesRouter._body(req)) }));
    router.post('/v1/messages', (req, res) => this._messages(req, res));
    return router;
  }

  _messages(req, res) {
    const upstream = this._getUpstream();
    if (!upstream) return AnthropicError.send(res, 503, 'overloaded_error', OpenAiLocalRouter.NO_MODEL_MESSAGE);
    const translated = MessagesRequestTranslator.translate(AnthropicMessagesRouter._body(req), upstream.modelId);
    if (translated.error) return AnthropicError.send(res, 400, 'invalid_request_error', translated.error);
    const body = ThinkingKnobs.apply(translated.body, typeof this._hostDial === 'function' ? this._hostDial() : null);
    const Runner = body.stream ? MessagesStream : MessagesCompletion;
    return Runner.run({ res, upstream, body, log: this._log });
  }

  static _body(req) {
    return (req.body && typeof req.body === 'object') ? req.body : {};
  }
}

module.exports = AnthropicMessagesRouter;
