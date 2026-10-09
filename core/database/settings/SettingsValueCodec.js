const JsonColumn = require('../JsonColumn');

class SettingsValueCodec {
  static encode(value) {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  static decode(text) {
    return JsonColumn.parse(text, (raw) => raw);
  }
}

module.exports = SettingsValueCodec;
