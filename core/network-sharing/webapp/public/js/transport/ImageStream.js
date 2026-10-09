import StreamFrames from './StreamFrames.js';

export default class ImageStream {
  static URL = '/sharing/image/generate';

  constructor(http) {
    this._http = http;
  }

  async generate(opts) {
    const { onProgress, signal } = opts || {};
    const res = await this._http.authed(ImageStream.URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts || {}),
      signal,
    });
    this._http.throwIfUnauthorized(res);
    if (!res.ok) throw new Error('Image generation unavailable');
    const result = { image: null };
    await StreamFrames.read(res.body, StreamFrames.NDJSON, (line) => ImageStream._onEvent(StreamFrames.json(line), result, onProgress));
    if (!result.image) throw new Error('No image returned');
    return result.image;
  }

  static _onEvent(evt, result, onProgress) {
    if (!evt) return;
    if (evt.type === 'progress' && onProgress) onProgress(evt.payload || {});
    else if (evt.type === 'image') ImageStream._takeImage(evt.payload, result);
    else if (evt.type === 'error') throw new Error((evt.payload && evt.payload.message) || 'generation failed');
  }

  static _takeImage(payload, result) {
    const img = payload && (payload.images || [])[0];
    if (img) result.image = { b64: img.b64, mime: img.mime || 'image/png' };
  }
}
