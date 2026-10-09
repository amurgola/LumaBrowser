export default class LumaBridge {
  static NO_EXT = 'luma.ext is not available in this view';

  static create(transport) {
    if (!transport || typeof transport.fetchPage !== 'function') return null;
    return {
      fetchPage: (url, opts) => LumaBridge._fetchPage(transport, url, opts),
      openTab: (url) => LumaBridge._openTab(transport, url),
      ext: (extensionId) => LumaBridge._ext(transport, extensionId),
    };
  }

  static async _fetchPage(transport, url, opts) {
    const o = opts || {};
    const result = await transport.fetchPage({ url, mode: o.mode, timeoutMs: o.timeoutMs, maxChars: o.maxChars });
    if (!result || result.success === false) throw new Error((result && result.error) || 'fetchPage failed');
    return result.content != null ? String(result.content) : '';
  }

  static async _openTab(transport, url) {
    if (typeof transport.openTab !== 'function') throw new Error('openTab is not available in this view');
    const result = await transport.openTab({ url });
    if (!result || result.success === false) throw new Error((result && result.error) || 'openTab failed');
    return true;
  }

  static _ext(transport, extensionId) {
    if (typeof transport.extCall !== 'function') throw new Error(LumaBridge.NO_EXT);
    const id = String(extensionId || '');
    return {
      extensionId: id,
      call: (method, ...args) => LumaBridge._extCall(transport, id, method, args),
      onEvent: (cb) => LumaBridge._extEvents(transport, id, cb),
    };
  }

  static async _extCall(transport, extensionId, method, args) {
    const result = await transport.extCall({ extensionId, method, args });
    if (!result || result.success === false) throw new Error((result && result.error) || 'extension call failed');
    return result.result;
  }

  static _extEvents(transport, extensionId, cb) {
    if (typeof transport.onExtEvent !== 'function' || typeof cb !== 'function') return () => {};
    return transport.onExtEvent(extensionId, (event) => cb(event));
  }
}
