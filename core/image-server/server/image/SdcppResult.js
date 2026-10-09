class SdcppResult {
  static FORMAT_MIME = {
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
  };

  static REDACTED_KEYS = ['b64_json', 'b64', 'images'];

  static images(data) {
    const list = data && data.result && Array.isArray(data.result.images) ? data.result.images : [];
    return list.map(SdcppResult._image).filter(Boolean);
  }

  static video(data) {
    const r = (data && data.result) || {};
    const b64 = SdcppResult._videoBase64(r);
    if (b64) return SdcppResult._video(r, b64);
    return SdcppResult._singleImageAsVideo(r);
  }

  static mimeForFormat(format) {
    return SdcppResult.FORMAT_MIME[String(format || '').toLowerCase()] || null;
  }

  static resultKeys(data) {
    try {
      return Object.keys((data && data.result) || {}).join(',') || '(none)';
    } catch (_) {
      return '(unreadable)';
    }
  }

  static redact(result) {
    if (!result || typeof result !== 'object') return result;
    const out = {};
    for (const key of Object.keys(result)) out[key] = SdcppResult.REDACTED_KEYS.includes(key) ? '[omitted]' : result[key];
    return out;
  }

  static _image(img) {
    const b64 = img && (img.b64_json || img.b64);
    if (!b64) return null;
    return {
      bytes: Buffer.from(b64, 'base64'),
      mime: img.mime || 'image/png',
      width: img.width || null,
      height: img.height || null,
      seed: img.seed != null ? img.seed : null,
    };
  }

  static _videoBase64(r) {
    if (r.b64_json || r.b64) return r.b64_json || r.b64;
    if (r.media && (r.media.b64_json || r.media.b64)) return r.media.b64_json || r.media.b64;
    if (typeof r.video === 'string') return r.video;
    return r.video ? r.video.b64_json || r.video.b64 : undefined;
  }

  static _video(r, b64) {
    return {
      bytes: Buffer.from(b64, 'base64'),
      mime: r.mime_type || (r.media && r.media.mime_type) || SdcppResult.mimeForFormat(r.output_format) || 'video/webm',
      fps: Number(r.fps) || null,
      frameCount: Number(r.frame_count) || null,
      outputFormat: r.output_format || null,
    };
  }

  static _singleImageAsVideo(r) {
    const imgs = Array.isArray(r.images) ? r.images : [];
    const b64 = imgs.length === 1 && imgs[0] && (imgs[0].b64_json || imgs[0].b64);
    if (!b64) return null;
    return { bytes: Buffer.from(b64, 'base64'), mime: 'image/png', fps: null, frameCount: 1, outputFormat: null };
  }
}

module.exports = SdcppResult;
