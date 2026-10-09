const fs = require('fs');
const path = require('path');

class ModelSidecars {
  static COMMON_BASENAMES = new Set([
    'config.json',
    'tokenizer.json',
    'tokenizer.model',
    'tokenizer_config.json',
    'modelfile',
    'modelfile.txt',
    'params.json',
    'generation_config.json',
    'special_tokens_map.json',
  ]);

  static STEM_EXTENSIONS = ['.json', '.yaml', '.yml', '.txt', '.toml'];

  static async attach(models) {
    const byDir = new Map();
    for (const model of models) {
      if (!byDir.has(model.directory)) byDir.set(model.directory, await ModelSidecars.listCandidates(model.directory));
      model.sidecars = ModelSidecars.forModel(model, byDir.get(model.directory));
    }
  }

  static async listCandidates(dir) {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() !== '.gguf')
        .map((entry) => entry.name);
    } catch (_) {
      return [];
    }
  }

  static forModel(model, candidateNames) {
    const out = [];
    const lowerStem = model.name.toLowerCase();
    for (const name of candidateNames || []) {
      const kind = ModelSidecars._kindOf(name.toLowerCase(), lowerStem);
      if (kind) out.push({ path: path.join(model.directory, name), name, kind });
    }
    return out;
  }

  static _kindOf(lowerName, lowerStem) {
    if (ModelSidecars.COMMON_BASENAMES.has(lowerName)) return 'common-config';
    const ext = path.extname(lowerName);
    if (!ModelSidecars.STEM_EXTENSIONS.includes(ext)) return null;
    return lowerName.slice(0, lowerName.length - ext.length) === lowerStem ? 'basename-match' : null;
  }
}

module.exports = ModelSidecars;
