const axios = require('axios');
const RouterPrompt = require('./RouterPrompt');

class RouterClient {
  static N_PREDICT = 32;

  constructor({ http = axios } = {}) {
    this._http = http;
  }

  async classify({ port, message, timeoutMs }) {
    const res = await this._http.post(`http://127.0.0.1:${port}/completion`, RouterClient.body(message), { timeout: timeoutMs });
    return RouterPrompt.parseRouterAnswer(res.data && res.data.content);
  }

  static body(message) {
    return {
      prompt: RouterPrompt.buildRouterPrompt(message),
      n_predict: RouterClient.N_PREDICT,
      temperature: 0,
      grammar: RouterPrompt.GRAMMAR,
      cache_prompt: true,
      stop: ['<|im_end|>'],
    };
  }
}

module.exports = RouterClient;
