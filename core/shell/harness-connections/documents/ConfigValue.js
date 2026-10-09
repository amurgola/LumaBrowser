const { isDeepStrictEqual } = require('util');

class ConfigValue {
  static isTable(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
  }

  static isEmptyTable(value) {
    return ConfigValue.isTable(value) && Object.keys(value).length === 0;
  }

  static same(a, b) {
    return isDeepStrictEqual(ConfigValue.plain(a), ConfigValue.plain(b));
  }

  static plain(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }
}

module.exports = ConfigValue;
