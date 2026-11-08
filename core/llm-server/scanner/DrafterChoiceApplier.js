const ModelName = require('../models/ModelName');
const LlmDrafterChoices = require('../service/LlmDrafterChoices');

class DrafterChoiceApplier {
  static apply(models, choices) {
    const library = DrafterChoiceApplier.library(models);
    const byPath = new Map(library.map((d) => [d.path, d]));
    const all = choices || {};
    for (const model of models) {
      if (!DrafterChoiceApplier._takesDrafter(model)) continue;
      DrafterChoiceApplier._applyOne(model, all[ModelName.key(model.weights[0].path)] || null, byPath);
    }
    return library;
  }

  static _takesDrafter(model) {
    return model && model.kind === 'weights' && model.role === 'main' && Array.isArray(model.drafter)
      && Array.isArray(model.weights) && model.weights.length > 0;
  }

  static _applyOne(model, choice, byPath) {
    model.drafterAuto = model.drafter.slice();
    model.drafterChoice = 'auto';
    model.mtpOff = false;
    DrafterChoiceApplier._choose(model, choice, byPath);
    model.drafterChoiceKey = LlmDrafterChoices.keyOf(choice);
    model.speculation = DrafterChoiceApplier.speculationOf(model);
  }

  static speculationOf(model) {
    if (Array.isArray(model.drafter) && model.drafter.length > 0) return 'drafter';
    return model.mtpCapable && !model.mtpOff ? 'mtp' : 'none';
  }

  static _choose(model, choice, byPath) {
    if (!choice) return;
    if (choice.mode === 'off' || choice.mode === 'mtp') {
      model.drafter = [];
      model.drafterChoice = choice.mode;
      model.mtpOff = choice.mode === 'off';
    } else if (choice.mode === 'file') {
      const pick = byPath.get(choice.path);
      if (pick) {
        model.drafter = [DrafterChoiceApplier._ref(pick)];
        model.drafterChoice = 'file';
      } else {
        model.drafterChoiceMissing = choice.path;
      }
    }
    DrafterChoiceApplier._retotal(model);
  }

  static library(models) {
    const byPath = new Map();
    const add = (ref, relativeDirectory, pairedTo) => {
      if (!ref || !ref.path) return;
      let entry = byPath.get(ref.path);
      if (!entry) {
        entry = { ...DrafterChoiceApplier._ref(ref), relativeDirectory: relativeDirectory || '', pairedWith: [] };
        byPath.set(ref.path, entry);
      }
      if (pairedTo && !entry.pairedWith.includes(pairedTo)) entry.pairedWith.push(pairedTo);
    };
    for (const model of models) {
      if (DrafterChoiceApplier._takesDrafter(model)) {
        const key = ModelName.key(model.weights[0].path);
        for (const ref of model.drafter) add(ref, model.relativeDirectory, key);
      } else if (model && model.kind === 'weights' && model.role === 'draft' && model.weights && model.weights[0]) {
        const g = model.gguf || {};
        add({ ...model.weights[0], architecture: g.architecture || null, blockSize: g.blockSize || null }, model.relativeDirectory, null);
      }
    }
    return [...byPath.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  static _ref(d) {
    return {
      path: d.path, name: d.name, sizeBytes: d.sizeBytes, modifiedAt: d.modifiedAt || null,
      architecture: d.architecture || null, blockSize: d.blockSize || null,
    };
  }

  static _retotal(model) {
    model.drafterTotalBytes = model.drafter.reduce((s, f) => s + (Number(f.sizeBytes) || 0), 0);
    model.totalBytes = (model.weightsTotalBytes || 0) + (model.mmprojTotalBytes || 0) + (model.mtpTotalBytes || 0) + model.drafterTotalBytes;
  }
}

module.exports = DrafterChoiceApplier;
