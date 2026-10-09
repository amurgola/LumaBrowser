const http = require('http');
const MultipartForm = require('./MultipartForm');

class WhisperInferenceClient {
  static TIMEOUT_MS = 60 * 1000;
  static HOST = '127.0.0.1';
  static ERROR_PREVIEW_CHARS = 200;

  static async transcribe({ port, wav, language, timeoutMs = WhisperInferenceClient.TIMEOUT_MS }) {
    const body = MultipartForm.build(WhisperInferenceClient._fields(language), {
      name: 'file', filename: 'utterance.wav', type: 'audio/wav', data: wav,
    });
    const url = `http://${WhisperInferenceClient.HOST}:${port}/inference`;
    const raw = await WhisperInferenceClient._post(url, body.buffer, body.contentType, timeoutMs);
    return WhisperInferenceClient._textOf(raw);
  }

  static _fields(language) {
    const fields = { response_format: 'json' };
    if (language && language !== 'auto') fields.language = language;
    return fields;
  }

  static _textOf(raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      throw new Error(`whisper-server returned a non-JSON response: ${WhisperInferenceClient._preview(raw)}`);
    }
    if (parsed.error) throw new Error(`whisper-server: ${parsed.error}`);
    return String(parsed.text || '').replace(/\s+/g, ' ').trim();
  }

  static _post(url, body, contentType, timeoutMs) {
    return new Promise((resolve, reject) => {
      const req = http.request(url, {
        method: 'POST',
        headers: { 'Content-Type': contentType, 'Content-Length': body.length },
        timeout: timeoutMs,
      }, (res) => WhisperInferenceClient._readResponse(res, resolve, reject));
      req.on('timeout', () => req.destroy(new Error('whisper-server request timed out')));
      req.on('error', reject);
      req.end(body);
    });
  }

  static _readResponse(res, resolve, reject) {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (res.statusCode && res.statusCode >= 400) reject(new Error(`whisper-server HTTP ${res.statusCode}: ${WhisperInferenceClient._preview(text)}`));
      else resolve(text);
    });
  }

  static _preview(text) {
    return String(text).slice(0, WhisperInferenceClient.ERROR_PREVIEW_CHARS);
  }
}

module.exports = WhisperInferenceClient;
