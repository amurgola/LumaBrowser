const axios = require('axios');
const SseLineReader = require('../../../llm-service/providers/SseLineReader');
const ChatErrorBody = require('./ChatErrorBody');

class OpenAiChatRequest {
  static DEAD_SOCKET_CODES = ['ECONNRESET', 'EPIPE'];

  constructor({ url, body, headers, signal, stream }) {
    this._url = url;
    this._body = body;
    this._headers = headers;
    this._signal = signal;
    this._stream = stream;
    this._retried = false;
    this._gotResponse = false;
  }

  start() {
    return this._post().catch((error) => this._onFailure(error));
  }

  _post() {
    return axios
      .post(this._url, this._body, {
        responseType: 'stream',
        headers: this._headers,
        signal: this._signal,
        timeout: 0,
      })
      .then((res) => this._readResponse(res));
  }

  async _readResponse(res) {
    this._gotResponse = true;
    await SseLineReader.read(res.data, (lines) => this._stream.handleLines(lines));
    this._stream.end();
  }

  async _onFailure(error) {
    if (this._stream.aborted) return undefined;
    if (this._isRetryable(error)) {
      this._retried = true;
      return this.start();
    }
    this._stream.fail(await OpenAiChatRequest._explain(error));
    return undefined;
  }

  _isRetryable(error) {
    return !this._retried && !this._gotResponse && OpenAiChatRequest.isDeadSocket(error);
  }

  static isDeadSocket(error) {
    if (!error || error.response) return false;
    return OpenAiChatRequest.DEAD_SOCKET_CODES.includes(error.code)
      || /socket hang up/i.test(String(error.message || ''));
  }

  static async _explain(error) {
    if (!error || !error.response) return error;
    const { status, statusText, data } = error.response;
    const detail = await ChatErrorBody.read(data);
    return new Error(`Chat request failed: HTTP ${status} ${statusText}${detail ? ` - ${detail}` : ''}`);
  }
}

module.exports = OpenAiChatRequest;
