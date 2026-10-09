class SdcppPayload {
  static STEP_KEYS = ['step', 'current_step', 'sample_step'];
  static TOTAL_KEYS = ['total_steps', 'steps', 'sample_steps'];
  static DEFAULT_PREVIEW_MIME = 'image/png';

  static progressOf(data) {
    const holder = data && (data.progress || data.status_detail || data);
    const step = SdcppPayload._pickNumber(holder, SdcppPayload.STEP_KEYS);
    const totalSteps = SdcppPayload._pickNumber(holder, SdcppPayload.TOTAL_KEYS);
    if (step == null && totalSteps == null) return null;
    return { step, totalSteps };
  }

  static previewOf(data) {
    const preview = data && data.preview;
    const b64 = preview && (preview.b64_json || preview.b64);
    if (!b64) return null;
    return { bytes: Buffer.from(b64, 'base64'), mime: preview.mime || SdcppPayload.DEFAULT_PREVIEW_MIME };
  }

  static errorMessage(err) {
    if (err == null) return '';
    if (typeof err === 'string') return err;
    if (typeof err !== 'object') return String(err);
    for (const key of ['message', 'error', 'detail']) {
      if (typeof err[key] === 'string' && err[key]) return err[key];
    }
    return SdcppPayload.stringify(err);
  }

  static stringify(value) {
    try {
      return typeof value === 'string' ? value : JSON.stringify(value);
    } catch (_) {
      return String(value);
    }
  }

  static positiveInt(value, fallback) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  static _pickNumber(holder, keys) {
    if (!holder) return null;
    for (const key of keys) {
      if (typeof holder[key] === 'number') return holder[key];
    }
    return null;
  }
}

module.exports = SdcppPayload;
