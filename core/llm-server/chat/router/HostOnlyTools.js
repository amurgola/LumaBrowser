class HostOnlyTools {
  static PREFIXES = ['terminal_'];

  static isHostOnly(toolName) {
    return HostOnlyTools.PREFIXES.some((prefix) => String(toolName || '').startsWith(prefix));
  }
}

module.exports = HostOnlyTools;
