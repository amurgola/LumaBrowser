class DeliveryEventSummary {
  static FACT_KEYS = ['event', 'method', 'contentType', 'name', 'path', 'relPath', 'size', 'monitorId', 'url',
    'checksum', 'verified', 'synthetic', 'catchUp'];
  static PREVIEW_CHARS = 300;
  static MAX_BODY_KEYS = 30;

  static compact(event) {
    if (!event || typeof event !== 'object') {
      return event == null ? null : { text: String(event).slice(0, DeliveryEventSummary.PREVIEW_CHARS) };
    }
    const out = DeliveryEventSummary._facts(event);
    DeliveryEventSummary._addBody(event, out);
    if (event.diffSummary) out.diffSummary = String(event.diffSummary).slice(0, DeliveryEventSummary.PREVIEW_CHARS);
    return out;
  }

  static _facts(event) {
    const out = {};
    for (const key of DeliveryEventSummary.FACT_KEYS) {
      if (event[key] !== undefined && event[key] !== null) out[key] = event[key];
    }
    return out;
  }

  static _addBody(event, out) {
    const max = DeliveryEventSummary.PREVIEW_CHARS;
    if (event.body !== undefined && event.body !== null) {
      if (typeof event.body !== 'object') {
        out.bodyPreview = String(event.body).slice(0, max);
        return;
      }
      out.bodyKeys = Object.keys(event.body).slice(0, DeliveryEventSummary.MAX_BODY_KEYS);
      out.bodyPreview = DeliveryEventSummary._safeJson(event.body).slice(0, max);
    } else if (event.bodyText != null) {
      out.bodyPreview = String(event.bodyText).slice(0, max);
    }
  }

  static _safeJson(value) {
    try {
      return JSON.stringify(value);
    } catch (_) {
      return '';
    }
  }
}

module.exports = DeliveryEventSummary;
