const ModelRuntimeResolver = require('./ModelRuntimeResolver');
const RuntimeFrameworks = require('./RuntimeFrameworks');

class HubSources {
  static TAG = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
  static EXTENSION = /^\.[A-Za-z0-9]+$/;

  static of(rows) {
    const sources = new Map();
    for (const row of (rows || []).filter(ModelRuntimeResolver.isInstalled)) {
      const source = HubSources._sourceOf(row);
      if (source && !sources.has(source.format)) sources.set(source.format, source);
    }
    return Array.from(sources.values());
  }

  static find(rows, format) {
    return HubSources.of(rows).find((source) => source.format === format) || null;
  }

  static _sourceOf(row) {
    const hub = row && row.hub;
    if (!hub || !HubSources.TAG.test(String(hub.tag || '')) || !HubSources.EXTENSION.test(String(hub.extension || ''))) return null;
    return { format: RuntimeFrameworks.formatsOf(row)[0], tag: hub.tag, extension: hub.extension.toLowerCase() };
  }
}

module.exports = HubSources;
