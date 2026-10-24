const FeatureRegistry = require('./FeatureRegistry');
const FeatureSettings = require('./FeatureSettings');

class FeatureDeps {
  constructor(context, shared) {
    this._context = context;
    this._shared = shared;
  }

  build(descriptor) {
    const id = descriptor.id;
    const ipc = FeatureDeps.scopedIpc(this._context.ipc, id);
    const context = this._context;
    return {
      id,
      db: context.db,
      ipc,
      get extensions() { return context.extensions || {}; },
      broadcast: this._shared.broadcast.forFeature(id),
      handoff: this._shared.handoff,
      speech: this._shared.speech,
      overlay: this._shared.overlay || null,
      hints: this._shared.hints || null,
      settings: new FeatureSettings(context.db, id),
      log: FeatureDeps.logger(context.logger, id),
      appInfo: this._shared.appInfo(),
      windows: this._shared.windows,
      browser: context.browser || null,
      services: context.sharedServices || {},
      clients: this._shared.clients,
      features: this._shared.features,
      [FeatureRegistry.DISPOSE]: () => ipc.dispose(),
    };
  }

  static scopedIpc(ipc, featureId) {
    const handles = new Set();
    const listeners = new Set();
    const name = (channel) => `${featureId}.${channel}`;
    return {
      channelPrefix: `ext.desktop-integration.${featureId}.`,
      handle: (channel, handler) => { if (ipc) { ipc.handle(name(channel), handler); handles.add(name(channel)); } },
      on: (channel, handler) => { if (ipc) { ipc.on(name(channel), handler); listeners.add(name(channel)); } },
      send: (win, channel, data) => { if (ipc) ipc.send(win, name(channel), data); },
      dispose: () => {
        for (const c of handles) { try { ipc.removeHandle(c); } catch (_) {} }
        for (const c of listeners) { try { ipc.removeOn(c); } catch (_) {} }
        handles.clear();
        listeners.clear();
      },
    };
  }

  static logger(base, featureId) {
    const tag = `desktop-integration/${featureId}:`;
    const fallback = { info: console.log, warn: console.warn, error: console.error, debug: () => {} };
    const out = {};
    for (const level of ['info', 'warn', 'error', 'debug']) {
      out[level] = (message, details) => {
        try {
          if (base && typeof base[level] === 'function') base[level](`${tag} ${message}`, details);
          else fallback[level](tag, message, details === undefined ? '' : details);
        } catch (_) {}
      };
    }
    return out;
  }
}

module.exports = FeatureDeps;
