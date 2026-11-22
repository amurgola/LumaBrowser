class RuntimeFrameworks {
  static GGUF = 'gguf';
  static MLX = 'mlx';
  static INFERENCE_KIND = 'inference';
  static MLX_LAUNCH_STYLE = 'mlx-server';

  static GGUF_MODEL_KIND = 'weights';
  static COMPANION_KINDS = Object.freeze(['mmproj-only', 'mtp-only']);

  static formatOfModel(model) {
    const kind = model && model.kind;
    if (!kind || RuntimeFrameworks.COMPANION_KINDS.includes(kind)) return null;
    return kind === RuntimeFrameworks.GGUF_MODEL_KIND ? RuntimeFrameworks.GGUF : kind;
  }

  static formatsOf(row) {
    if (row && Array.isArray(row.modelKinds) && row.modelKinds.length > 0) return row.modelKinds.slice();
    if (row && row.launchStyle === RuntimeFrameworks.MLX_LAUNCH_STYLE) return [RuntimeFrameworks.MLX];
    return [RuntimeFrameworks.GGUF];
  }

  static frameworkIdOf(row) {
    return (row && (row.framework || row.id)) || null;
  }

  static frameworkNameOf(row) {
    return (row && (row.frameworkName || row.name || row.id)) || '';
  }

  static loads(row, format) {
    return !!format && RuntimeFrameworks.formatsOf(row).includes(format);
  }

  static group(rows) {
    const frameworks = new Map();
    for (const row of (rows || []).filter(RuntimeFrameworks._isInference)) {
      const id = RuntimeFrameworks.frameworkIdOf(row);
      if (!frameworks.has(id)) frameworks.set(id, { id, name: RuntimeFrameworks.frameworkNameOf(row), formats: [], buildIds: [] });
      RuntimeFrameworks._addBuild(frameworks.get(id), row);
    }
    return Array.from(frameworks.values());
  }

  static _isInference(row) {
    return !!row && (row.kind || RuntimeFrameworks.INFERENCE_KIND) === RuntimeFrameworks.INFERENCE_KIND;
  }

  static _addBuild(framework, row) {
    framework.buildIds.push(row.id);
    for (const format of RuntimeFrameworks.formatsOf(row)) {
      if (!framework.formats.includes(format)) framework.formats.push(format);
    }
  }
}

module.exports = RuntimeFrameworks;
