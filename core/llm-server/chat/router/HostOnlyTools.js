class HostOnlyTools {
  static PREFIXES = ['terminal_'];

  static NAMES = new Set(['train_lora', 'lora_training_status', 'cancel_lora_training', 'apply_lora']);

  static isHostOnly(toolName) {
    const name = String(toolName || '');
    return HostOnlyTools.NAMES.has(name) || HostOnlyTools.PREFIXES.some((prefix) => name.startsWith(prefix));
  }
}

module.exports = HostOnlyTools;
