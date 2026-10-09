const fs = require('fs');
const path = require('path');
const ImageLoraCatalog = require('../models/ImageLoraCatalog');
const LoraInspector = require('../models/LoraInspector');
const LoraRepacker = require('../models/LoraRepacker');
const PathPicker = require('../../shared/ipc/PathPicker');
const ImageDownloadSlot = require('./ImageDownloadSlot');

class ImageLoraLibrary {
  static EXT = /\.safetensors$/i;
  static NOT_A_LORA = 'This file has no LoRA adapter weights. It looks like a full model checkpoint; '
    + 'import it from the Models section instead.';

  constructor({ imageServerService, slot, loraCatalog = new ImageLoraCatalog(), pickPath = PathPicker.pick }) {
    this._svc = imageServerService;
    this._slot = slot;
    this._loraCatalog = loraCatalog;
    this._pickPath = pickPath;
    this._inspectCache = new Map();
  }

  dir() {
    return path.join(this._svc.getModelsDirConfig().effectivePath, 'loras');
  }

  list() {
    const dir = this.dir();
    if (!fs.existsSync(dir)) return { dir, loras: [] };
    const loras = fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && ImageLoraLibrary.EXT.test(d.name))
      .map((d) => this._describe(dir, d.name));
    return { dir, loras };
  }

  async import(event, args = {}) {
    const src = await this._sourceFor(event, args);
    if (!src) return { canceled: true };
    const insp = ImageLoraLibrary._inspectImportable(src);
    const dest = this._copyIn(src);
    const repacked = insp.needsFusedMlpRepack ? ImageLoraLibrary._repack(dest) : false;
    const base = path.basename(src);
    return { name: ImageLoraLibrary.nameOf(base), file: base, base: insp.base, families: insp.families, form: insp.form, repacked };
  }

  catalogView() {
    const dir = this.dir();
    const loras = this._loraCatalog.list().map((entry) => {
      const files = this._loraCatalog.entryFiles(entry);
      return {
        ...entry,
        name: files.length ? ImageLoraLibrary.nameOf(files[0].file) : null,
        installed: files.length > 0 && files.every((f) => fs.existsSync(path.join(dir, f.file))),
        pair: files.length > 1,
        attach: files.map((f) => ({ name: ImageLoraLibrary.nameOf(f.file), ...(f.highNoise ? { highNoise: true } : {}) })),
      };
    });
    return { loras };
  }

  download(args, send) {
    return ImageDownloadSlot.reportingFailures(send, () => this._download(args || {}, send));
  }

  async _download({ id }, send) {
    const entry = id ? this._loraCatalog.getById(id) : null;
    if (!entry) return { success: false, error: 'A LoRA catalog id is required.' };
    if (this._slot.busy) return { success: false, error: ImageDownloadSlot.BUSY };
    const dir = this.dir();
    fs.mkdirSync(dir, { recursive: true });
    const entryFiles = this._loraCatalog.entryFiles(entry);
    if (!entryFiles.length) return { success: false, error: 'Catalog entry has no downloadable files.' };
    const files = entryFiles.map((f) => ({ role: 'lora', url: f.url, destPath: path.join(dir, f.file) }));
    return this._slot.run({
      files,
      dir,
      send,
      start: { id: entry.id, dir, files: entryFiles.map((f) => ({ role: 'lora', file: f.file })) },
      onDownloaded: () => {
        files.forEach((f) => ImageLoraLibrary._repackDownloaded(f.destPath));
        send('done', { id: entry.id, dir });
        return { success: true, id: entry.id, name: ImageLoraLibrary.nameOf(entryFiles[0].file) };
      },
    });
  }

  _describe(dir, fileName) {
    const full = path.join(dir, fileName);
    let bytes = 0;
    try { bytes = fs.statSync(full).size; } catch (_) {}
    const insp = this._inspectCached(full);
    const ok = !!(insp && insp.ok);
    return {
      name: ImageLoraLibrary.nameOf(fileName),
      file: fileName,
      bytes,
      base: (ok && insp.base) || null,
      families: (ok && insp.families) || [],
      form: (ok && insp.form) || null,
    };
  }

  _inspectCached(filePath) {
    try {
      const st = fs.statSync(filePath);
      const key = `${filePath} ${st.size} ${st.mtimeMs}`;
      if (!this._inspectCache.has(key)) this._inspectCache.set(key, LoraInspector.inspect(filePath));
      return this._inspectCache.get(key);
    } catch (_) {
      return null;
    }
  }

  async _sourceFor(event, args) {
    const given = args && typeof args.path === 'string' && args.path.trim();
    if (given) return given;
    const picked = await this._pickPath(event, {
      title: 'Pick a LoRA (.safetensors)',
      properties: ['openFile'],
      filters: [{ name: 'LoRA', extensions: ['safetensors'] }, { name: 'All files', extensions: ['*'] }],
    });
    return picked.canceled ? null : picked.paths[0];
  }

  _copyIn(src) {
    const dir = this.dir();
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, path.basename(src));
    fs.copyFileSync(src, dest);
    return dest;
  }

  static _inspectImportable(src) {
    if (!fs.existsSync(src)) throw new Error(`File not found: ${src}`);
    if (!ImageLoraLibrary.EXT.test(src)) throw new Error('Only .safetensors LoRA files can be imported here.');
    const insp = LoraInspector.inspect(src);
    if (!insp.ok) throw new Error(insp.error);
    if (!insp.isLora) throw new Error(ImageLoraLibrary.NOT_A_LORA);
    return insp;
  }

  static _repack(filePath) {
    const r = LoraRepacker.repackInPlaceIfNeeded(filePath);
    if (r.error) console.warn('[image-server] LoRA fused-MLP repack failed:', r.error);
    return !!r.repacked;
  }

  static _repackDownloaded(filePath) {
    try {
      const insp = LoraInspector.inspect(filePath);
      if (insp.ok && insp.needsFusedMlpRepack) ImageLoraLibrary._repack(filePath);
    } catch (err) {
      console.warn('[image-server] LoRA inspect after download failed:', err && err.message);
    }
  }

  static nameOf(fileName) {
    return fileName.replace(ImageLoraLibrary.EXT, '');
  }
}

module.exports = ImageLoraLibrary;
