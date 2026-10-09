class IpcEnvelope {
  static CLONEABLE_PRIMITIVES = ['string', 'number', 'boolean', 'undefined', 'bigint'];

  static enveloped(fn) {
    return async function envelopedHandler(...args) {
      try {
        return IpcEnvelope._wrapPayload(await fn.apply(this, args));
      } catch (err) {
        return IpcEnvelope._wrapError(err);
      }
    };
  }

  static raw(fn) {
    return fn;
  }

  static errorFields(err) {
    const fields = {};
    if (!err || typeof err !== 'object') return fields;
    for (const key of Object.keys(err)) {
      if (IpcEnvelope._isCopyableErrorField(key, err[key])) fields[key] = err[key];
    }
    return fields;
  }

  static isCloneable(value) {
    if (value === null) return true;
    const type = typeof value;
    if (IpcEnvelope.CLONEABLE_PRIMITIVES.includes(type)) return true;
    if (type === 'function' || type === 'symbol') return false;
    if (value instanceof Date) return true;
    if (Array.isArray(value)) return value.every(IpcEnvelope.isCloneable);
    return IpcEnvelope._isPlainPrototype(value) && Object.values(value).every(IpcEnvelope.isCloneable);
  }

  static _wrapPayload(payload) {
    if (payload == null) return { success: true };
    if (!IpcEnvelope._isPlainObject(payload)) return { success: true, data: payload };
    if (Object.prototype.hasOwnProperty.call(payload, 'success')) return payload;
    return { success: true, ...payload };
  }

  static _wrapError(err) {
    return {
      success: false,
      error: (err && err.message) || String(err),
      ...IpcEnvelope.errorFields(err),
    };
  }

  static _isCopyableErrorField(key, value) {
    if (key === 'message' || key === 'stack') return false;
    return IpcEnvelope.isCloneable(value);
  }

  static _isPlainObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return IpcEnvelope._isPlainPrototype(value);
  }

  static _isPlainPrototype(value) {
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }
}

module.exports = IpcEnvelope;
