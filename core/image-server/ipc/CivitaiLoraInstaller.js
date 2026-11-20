const fs = require('fs');
const path = require('path');
const CivitaiLoraResolver = require('../civitai/CivitaiLoraResolver');
const CivitaiModelResolver = require('../civitai/CivitaiModelResolver');
const LoraBaseDetector = require('../models/LoraBaseDetector');
const LoraSidecar = require('../models/LoraSidecar');
const ImageDownloadSlot = require('./ImageDownloadSlot');
const ImageLoraLibrary = require('./ImageLoraLibrary');

class CivitaiLoraInstaller {
  constructor({ library, slot, resolver = new CivitaiLoraResolver() }) {
    this._library = library;
    this._slot = slot;
    this._resolver = resolver;
  }

  install(args, send) {
    return ImageDownloadSlot.reportingFailures(send, () => this._install(args || {}, send));
  }

  async _install(args, send) {
    const resolved = await this._resolver.resolve(args);
    if (resolved.error) return { success: false, error: resolved.error };
    const dir = this._library.dir();
    const fileName = CivitaiLoraInstaller._freeFileName(dir, resolved);
    const installed = this._installedRow(fileName);
    if (installed) return { success: true, alreadyInstalled: true, lora: installed };
    return this._download(resolved, dir, fileName, send);
  }

  _download(resolved, dir, fileName, send) {
    const destPath = path.join(dir, fileName);
    const id = `civitai-lora-${resolved.version.id}`;
    fs.mkdirSync(dir, { recursive: true });
    return this._slot.run({
      files: [{ role: 'lora', url: resolved.url, destPath, ...CivitaiModelResolver.expectations(resolved.file) }],
      dir,
      send,
      start: { id, dir, files: [{ role: 'lora', file: fileName }] },
      onDownloaded: () => {
        const filed = CivitaiLoraInstaller._record(resolved, ImageLoraLibrary.headerBase(destPath));
        const lora = this._library.adopt(destPath, filed.record);
        send('done', { id, dir });
        return { success: true, lora, ...(filed.note ? { baseNote: filed.note } : {}) };
      },
    });
  }

  _installedRow(fileName) {
    const name = ImageLoraLibrary.nameOf(fileName);
    return this._library.list().loras.find((lora) => lora.name === name) || null;
  }

  static _freeFileName(dir, { fileName, version, file }) {
    const full = path.join(dir, fileName);
    if (!fs.existsSync(full)) return fileName;
    const held = LoraSidecar.read(full);
    if (held && held.versionId === version.id && held.fileId === file.id) return fileName;
    return `${ImageLoraLibrary.nameOf(fileName)}-${version.id}.safetensors`;
  }

  static _record({ record, base }, header) {
    const listedFamilies = LoraBaseDetector.BASES[base.base].families;
    const agrees = !header.families.length || header.families.some((family) => listedFamilies.includes(family));
    if (agrees) return { record, note: null };
    return {
      record: { ...record, base: header.base.id, baseModel: header.base.label },
      note: `CivitAI lists this LoRA for ${base.baseModel}, but its weights are for ${header.base.label}; it is filed under ${header.base.label}.`,
    };
  }
}

module.exports = CivitaiLoraInstaller;
