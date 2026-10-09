class InstalledImageModels {
  static DEFAULT_FIELDS = { generate: 'modelId', edit: 'editModelId', video: 'videoModelId' };

  constructor({ scanner, getModelsDir, getDefaults, resolveDisplayName }) {
    this._scanner = scanner;
    this._getModelsDir = getModelsDir;
    this._getDefaults = getDefaults;
    this._resolveDisplayName = resolveDisplayName;
  }

  async list(kind = null) {
    const scan = await this._scanner.scan(this._getModelsDir());
    const defaults = this._getDefaults();
    const rows = [];
    for (const model of (scan.models || [])) {
      if (!model || !model.id) continue;
      for (const slotKind of InstalledImageModels.slotKindsOf(model)) {
        if (!kind || slotKind === kind) rows.push(this._row(model, slotKind, defaults));
      }
    }
    return rows.sort(InstalledImageModels._currentThenLabel);
  }

  static slotKindsOf(model) {
    const kind = model.kind === 'edit' || model.kind === 'video' ? model.kind : 'generate';
    return kind === 'generate' && model.supportsEdit ? ['generate', 'edit'] : [kind];
  }

  _row(model, slotKind, defaults) {
    return {
      id: model.id,
      label: this._resolveDisplayName(model.id) || model.label || model.id,
      kind: slotKind,
      current: model.id === defaults[InstalledImageModels.DEFAULT_FIELDS[slotKind]],
    };
  }

  static _currentThenLabel(a, b) {
    return ((b.current ? 1 : 0) - (a.current ? 1 : 0)) || String(a.label).localeCompare(String(b.label));
  }
}

module.exports = InstalledImageModels;
