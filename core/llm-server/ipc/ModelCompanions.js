const HfGgufRepo = require('../models/HfGgufRepo');
const GgufCompanionPicker = require('../models/GgufCompanionPicker');
const GgufFileName = require('../models/GgufFileName');
const HfModelInput = require('./HfModelInput');

class ModelCompanions {
  constructor({ gguf = HfGgufRepo } = {}) {
    this._gguf = gguf;
  }

  async resolve(url, file) {
    const repoId = HfModelInput.repoIdFromUrl(url);
    const { mmproj, mtp } = repoId ? await this._pick(repoId, file) : { mmproj: null, mtp: null };
    const downloads = [
      mmproj ? { ...mmproj, kind: 'mmproj', label: 'vision projector' } : null,
      mtp ? { ...mtp, kind: 'mtp', label: 'draft head' } : null,
    ].filter(Boolean);
    return { repoId, mmproj, mtp, downloads };
  }

  async _pick(repoId, file) {
    try {
      const companions = await this._gguf.fetchCompanions(repoId);
      return {
        mmproj: GgufCompanionPicker.bestMmproj(companions.mmprojs),
        mtp: GgufCompanionPicker.bestMtp(companions.mtps, { quant: GgufFileName.quantOf(file) }),
      };
    } catch (_) {
      return { mmproj: null, mtp: null };
    }
  }
}

module.exports = ModelCompanions;
