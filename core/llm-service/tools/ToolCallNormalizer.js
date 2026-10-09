class ToolCallNormalizer {
  static MARKER_KEYS = ['__argsLost', '__argsCut', '__repaired'];
  static NAME_KEYS = ['tool', 'name', 'params', 'arguments'];

  static normalize(value) {
    if (!ToolCallNormalizer._isObject(value)) return null;
    const tool = ToolCallNormalizer._toolName(value);
    if (!tool) return null;
    return { ...ToolCallNormalizer._paramsAndShape(value, tool), ...ToolCallNormalizer._markers(value) };
  }

  static _toolName(value) {
    if (typeof value.tool === 'string') return value.tool;
    return typeof value.name === 'string' ? value.name : null;
  }

  static _paramsAndShape(value, tool) {
    if (ToolCallNormalizer._isObject(value.params)) {
      return typeof value.tool === 'string'
        ? { tool, params: value.params }
        : { tool, params: value.params, __coerced: 'aliased-keys' };
    }
    if (ToolCallNormalizer._isObject(value.arguments)) return { tool, params: value.arguments, __coerced: 'aliased-keys' };
    return { tool, params: ToolCallNormalizer._flattenedParams(value), __coerced: 'flattened-params' };
  }

  static _flattenedParams(value) {
    const reserved = new Set([...ToolCallNormalizer.NAME_KEYS, ...ToolCallNormalizer.MARKER_KEYS]);
    return Object.fromEntries(Object.entries(value).filter(([key]) => !reserved.has(key)));
  }

  static _markers(value) {
    const markers = {};
    if (typeof value.__argsLost === 'string') markers.__argsLost = value.__argsLost;
    if (value.__argsCut === true) markers.__argsCut = true;
    if (value.__repaired === true) markers.__repaired = true;
    return markers;
  }

  static _isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}

module.exports = ToolCallNormalizer;
