const http = require('http');
const https = require('https');

class UpstreamChatRequest {
  static PATH = '/v1/chat/completions';

  static open(upstream, body, { onResponse, onError }) {
    const url = UpstreamChatRequest._url(upstream, onError);
    if (!url) return null;
    const payload = Buffer.from(JSON.stringify(body));
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.request(url, { method: 'POST', headers: UpstreamChatRequest._headers(upstream, body, payload) }, onResponse);
    request.on('error', onError);
    request.end(payload);
    return request;
  }

  static collect(response, onText) {
    let raw = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => { raw += chunk; });
    response.on('end', () => onText(raw));
  }

  static isFailure(response) {
    return !response.statusCode || response.statusCode >= 400;
  }

  static errorText(raw, status) {
    const parsed = UpstreamChatRequest.parseJson(raw);
    const message = (parsed && parsed.error && (parsed.error.message || parsed.error)) || raw || `upstream ${status}`;
    return String(message);
  }

  static parseJson(raw) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  static unreachableMessage(error) {
    return `Could not reach the local model server: ${(error && error.message) || error}`;
  }

  static _url(upstream, onError) {
    try {
      return new URL(UpstreamChatRequest.PATH, upstream.baseUrl);
    } catch (error) {
      onError(new Error(`Bad upstream URL: ${error.message}`));
      return null;
    }
  }

  static _headers(upstream, body, payload) {
    const headers = {
      'content-type': 'application/json',
      'content-length': payload.length,
      accept: body.stream ? 'text/event-stream' : 'application/json',
    };
    if (upstream.apiKey) headers.authorization = `Bearer ${upstream.apiKey}`;
    return headers;
  }
}

module.exports = UpstreamChatRequest;
