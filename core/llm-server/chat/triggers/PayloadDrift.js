class PayloadDrift {
  static MAX_KEYS = 80;
  static MAX_DEPTH = 2;
  static MAX_ADDED_REPORTED = 20;

  static shapeOf(event, kind = 'webhook') {
    if (!event || typeof event !== 'object' || kind === 'page') return null;
    if (kind === 'file') return PayloadDrift._fileShape(event);
    return { contentType: PayloadDrift._mainContentType(event.contentType), keys: PayloadDrift._bodyKeys(event) };
  }

  static diffShape(sampleShape, liveShape) {
    if (!sampleShape || !liveShape) return null;
    const sampleKeys = sampleShape.keys || {};
    const liveKeys = liveShape.keys || {};
    const { missing, typeChanged } = PayloadDrift._compareSampleKeys(sampleKeys, liveKeys);
    const added = Object.keys(liveKeys).filter((path) => !(path in sampleKeys));
    const topMissing = PayloadDrift._topMostMissing(missing, typeChanged);
    const contentTypeChanged = PayloadDrift._contentTypeChange(sampleShape, liveShape);
    const drifted = topMissing.length > 0 || typeChanged.length > 0 || !!contentTypeChanged;
    return {
      drifted,
      missing: topMissing,
      typeChanged,
      added: added.slice(0, PayloadDrift.MAX_ADDED_REPORTED),
      contentTypeChanged,
      sig: drifted ? PayloadDrift._signature(topMissing, typeChanged, contentTypeChanged) : '',
    };
  }

  static describe(diff) {
    if (!diff || !diff.drifted) return '';
    const bits = [];
    if (diff.missing.length) bits.push(`missing ${diff.missing.join(', ')}`);
    if (diff.typeChanged.length) bits.push(diff.typeChanged.map((c) => `${c.path} is now ${c.to} (was ${c.from})`).join(', '));
    if (diff.contentTypeChanged) bits.push(`content type is now ${diff.contentTypeChanged.to} (was ${diff.contentTypeChanged.from})`);
    return bits.join('; ');
  }

  static driftOf(sample, event, kind = 'webhook') {
    return PayloadDrift.diffShape(PayloadDrift.shapeOf(sample, kind), PayloadDrift.shapeOf(event, kind));
  }

  static _fileShape(event) {
    return { contentType: null, keys: { ext: event.ext || '', isText: PayloadDrift._typeOf(event.isText === undefined ? true : event.isText) } };
  }

  static _mainContentType(contentType) {
    return String(contentType || '').split(';')[0].trim().toLowerCase() || null;
  }

  static _bodyKeys(event) {
    const keys = {};
    if (event.body && typeof event.body === 'object' && !Array.isArray(event.body)) PayloadDrift._walk(event.body, 'body', 1, keys);
    else if (event.body !== undefined && event.body !== null) keys.body = PayloadDrift._typeOf(event.body);
    else if (event.bodyText != null) keys.bodyText = 'string';
    return keys;
  }

  static _walk(value, prefix, depth, out) {
    for (const [key, child] of Object.entries(value)) {
      if (Object.keys(out).length >= PayloadDrift.MAX_KEYS) return;
      const path = `${prefix}.${key}`;
      out[path] = PayloadDrift._typeOf(child);
      if (depth < PayloadDrift.MAX_DEPTH && PayloadDrift._typeOf(child) === 'object') PayloadDrift._walk(child, path, depth + 1, out);
    }
  }

  static _typeOf(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  static _compareSampleKeys(sampleKeys, liveKeys) {
    const missing = [];
    const typeChanged = [];
    for (const [path, type] of Object.entries(sampleKeys)) {
      const liveType = liveKeys[path];
      if (liveType === undefined) missing.push(path);
      else if (liveType !== type && type !== 'null' && liveType !== 'null') typeChanged.push({ path, from: type, to: liveType });
    }
    return { missing, typeChanged };
  }

  static _topMostMissing(missing, typeChanged) {
    const parents = [...missing, ...typeChanged.map((c) => c.path)];
    return missing.filter((path) => !parents.some((parent) => parent !== path && path.startsWith(`${parent}.`)));
  }

  static _contentTypeChange(sampleShape, liveShape) {
    const from = sampleShape.contentType;
    const to = liveShape.contentType;
    return from && to && from !== to ? { from, to } : null;
  }

  static _signature(missing, typeChanged, contentTypeChanged) {
    return [
      missing.map((p) => `-${p}`).join(','),
      typeChanged.map((c) => `~${c.path}:${c.from}>${c.to}`).join(','),
      contentTypeChanged ? `ct:${contentTypeChanged.to}` : '',
    ].filter(Boolean).join('|');
  }
}

module.exports = PayloadDrift;
