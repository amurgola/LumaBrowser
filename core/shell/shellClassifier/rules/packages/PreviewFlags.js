class PreviewFlags {
  static NAMES = Object.freeze(['dry-run', 'dryrun', 'preview-only', 'whatif', 'what-if']);

  static OFF_VALUES = Object.freeze(['none', 'false', '$false', '0', 'no']);

  static rehearses(toolArgs) {
    if (!toolArgs.hasOption(...PreviewFlags.NAMES)) return false;
    return !toolArgs.inlineValuesOf(...PreviewFlags.NAMES).some((value) => PreviewFlags.OFF_VALUES.includes(value));
  }
}

module.exports = PreviewFlags;
