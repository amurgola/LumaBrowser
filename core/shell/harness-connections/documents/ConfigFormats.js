const JsoncDocument = require('./JsoncDocument');
const TomlDocument = require('./TomlDocument');

class ConfigFormats {
  static ALL = [JsoncDocument, TomlDocument];

  static byId(id) {
    const format = ConfigFormats.ALL.find((f) => f.ID === id);
    if (!format) throw new Error(`Unknown config format: ${id}`);
    return format;
  }
}

module.exports = ConfigFormats;
