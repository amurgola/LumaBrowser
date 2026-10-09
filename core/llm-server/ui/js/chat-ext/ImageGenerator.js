export default class ImageGenerator {
  static TIMEOUT_MS = 1200000;

  static generate(api, opts, timeoutMs = ImageGenerator.TIMEOUT_MS) {
    return new Promise((resolve) => {
      if (!api || !api.image || !api.image.generate) return resolve({ error: 'Image server unavailable.' });
      const requestId = 'imggen-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      let off = null;
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        try { if (off) off(); } catch (_) {}
        resolve(value);
      };
      try {
        off = api.image.onImageEvent((evt) => ImageGenerator._onEvent(evt, requestId, finish));
        api.image.generate({ requestId, ...opts });
      } catch (e) {
        finish({ error: (e && e.message) || 'Image request failed.' });
      }
      setTimeout(() => finish({ error: 'Timed out (model may still be loading, try again).' }), timeoutMs);
    });
  }

  static dataUri(img) {
    return 'data:' + ((img && img.mime) || 'image/png') + ';base64,' + (img && img.b64);
  }

  static _onEvent(evt, requestId, finish) {
    if (!evt || evt.requestId !== requestId) return;
    if (evt.type === 'done') {
      const img = evt.payload && evt.payload.images && evt.payload.images[0];
      finish(img && img.b64 ? { b64: img.b64, mime: img.mime || 'image/png' } : { error: 'No image returned.' });
    } else if (evt.type === 'error') {
      finish({ error: (evt.payload && evt.payload.message) || 'Image generation failed.' });
    }
  }
}
