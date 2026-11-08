const HfGgufRepo = require('../models/HfGgufRepo');
const HfPinnedRepo = require('../models/HfPinnedRepo');
const DrafterCatalog = require('../models/DrafterCatalog');
const GgufCompanionPicker = require('../models/GgufCompanionPicker');
const GgufFileName = require('../models/GgufFileName');
const HfModelInput = require('./HfModelInput');

class ModelCompanions {
  constructor({ gguf = HfGgufRepo, catalog = DrafterCatalog, pin = (repoId, opts) => HfPinnedRepo.pin(repoId, opts) } = {}) {
    this._gguf = gguf;
    this._catalog = catalog;
    this._pin = pin;
  }

  async resolve(url, file, { revision } = {}) {
    const repoId = HfModelInput.repoIdFromUrl(url);
    const { mmproj, mtp } = repoId ? await this._pick(repoId, file, revision) : { mmproj: null, mtp: null };
    const drafter = await this._pickDrafter(repoId, file);
    const downloads = [
      mmproj ? { ...mmproj, kind: 'mmproj', label: 'vision projector' } : null,
      mtp ? { ...mtp, kind: 'mtp', label: 'draft head' } : null,
      drafter ? { ...drafter, kind: 'drafter', label: `${drafter.label} drafter` } : null,
    ].filter(Boolean);
    return { repoId, mmproj, mtp, drafter, downloads };
  }

  async _pickDrafter(repoId, file) {
    const entry = this._catalog.entryForDownload(repoId, file);
    if (!entry) return null;
    try {
      const pinned = await this._pin(entry.repo, {});
      const picked = this._catalog.pickFile(entry, pinned.files);
      if (!picked) return null;
      return {
        file: GgufFileName.basename(picked.path), path: picked.path, url: pinned.urlFor(picked.path),
        approxBytes: picked.size, sha256: picked.sha256, id: entry.id, label: entry.label, repo: entry.repo,
      };
    } catch (_) {
      return null;
    }
  }

  async _pick(repoId, file, revision) {
    try {
      const companions = await this._gguf.fetchCompanions(repoId, revision ? { revision } : {});
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
