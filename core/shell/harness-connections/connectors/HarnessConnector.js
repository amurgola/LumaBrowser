const ConfigFile = require('../ConfigFile');
const ConfigValue = require('../documents/ConfigValue');
const KeyPath = require('../documents/KeyPath');
const LedgerEntry = require('../changes/LedgerEntry');

class HarnessConnector {
  static LOCAL_TOKEN = 'lumabrowser-local';
  static MCP_NAME = 'luma-browser';

  constructor({ id, name, executable, format, staleReason }) {
    this.id = id;
    this.name = name;
    this.executable = executable;
    this.format = format;
    this._staleReason = staleReason;
  }

  configFiles(paths) {
    throw new Error(`${this.constructor.name} must implement configFiles(paths)`);
  }

  plan({ paths, endpoints, model, now }) {
    throw new Error(`${this.constructor.name} must implement plan()`);
  }

  inspect({ paths, endpoints }) {
    const file = this.configFiles(paths)[0];
    const data = this._tryRead(file);
    if (!data) return { state: 'unavailable', reason: `Fix invalid ${this.format.LABEL} in ${file} before connecting or disconnecting.` };
    if (this._isConnected(data, endpoints)) return { state: 'connected' };
    return { state: 'disconnected', reason: this._staleReason };
  }

  owns(entry, found, data, endpoints) {
    return found.present && this._recognises(entry, found.value, data, endpoints);
  }

  legacyPriors(restore, paths) {
    return [];
  }

  _isConnected(data, endpoints) {
    throw new Error(`${this.constructor.name} must implement _isConnected(data, endpoints)`);
  }

  _recognises(entry, value, data, endpoints) {
    return entry.wrote !== undefined && ConfigValue.same(value, entry.wrote);
  }

  _tryRead(file) {
    try {
      return this.format.open(ConfigFile.readTextOr(file, null)).data();
    } catch (_) {
      return null;
    }
  }

  static _isAt(entry, path) {
    return KeyPath.equals(entry.path, path);
  }

  static _prior(file, path, value) {
    return { file, path, prior: value == null ? LedgerEntry.ABSENT : { present: true, value } };
  }

  static _mcpEnv(endpoints) {
    return endpoints.mcp.env || {};
  }
}

module.exports = HarnessConnector;
