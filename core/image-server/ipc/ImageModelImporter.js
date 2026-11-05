const fs = require('fs');
const path = require('path');
const ImageModelCatalog = require('../models/ImageModelCatalog');
const ImagePromptProfiles = require('../prompt/ImagePromptProfiles');
const PathPicker = require('../../shared/ipc/PathPicker');
const CivitaiModelResolver = require('../civitai/CivitaiModelResolver');
const CivitaiRecipe = require('../civitai/CivitaiRecipe');
const AllInOneCheckpoint = require('./AllInOneCheckpoint');
const CatalogModelInstaller = require('./CatalogModelInstaller');
const FileCopyProgress = require('./FileCopyProgress');
const HfRepoRecipes = require('./HfRepoRecipes');
const HfRepoSiblings = require('./HfRepoSiblings');
const ImageDownloadSlot = require('./ImageDownloadSlot');
const ImageManifestBuilder = require('./ImageManifestBuilder');
const ImageModelManifest = require('./ImageModelManifest');
const ImportCompanions = require('./ImportCompanions');
const ImportedEntryBuilder = require('./ImportedEntryBuilder');

class ImageModelImporter {
  static PROFILE_BASES = Object.freeze(['sdxl', 'sd-1-5']);

  static REPO_URL_HINT = 'Paste a HuggingFace model page URL, e.g. https://huggingface.co/circlestone-labs/Anima';

  constructor({
    imageServerService, slot, catalog = new ImageModelCatalog(), fetchSiblings = HfRepoSiblings.fetchListing, pickPath = PathPicker.pick,
    civitai = null, recipes = null,
  }) {
    this._svc = imageServerService;
    this._slot = slot;
    this._catalog = catalog;
    this._fetchSiblings = fetchSiblings;
    this._pickPath = pickPath;
    this._civitai = civitai;
    this._recipes = recipes;
  }

  static promptProfiles() {
    const byBase = {};
    for (const base of ImageModelImporter.PROFILE_BASES) byBase[base] = ImagePromptProfiles.profilesForBase(base);
    return { byBase };
  }

  async pickFile(event) {
    const picked = await this._pickPath(event, {
      title: 'Pick an image-model checkpoint',
      properties: ['openFile'],
      filters: [{ name: 'Model checkpoint', extensions: ['safetensors', 'ckpt', 'gguf'] }, { name: 'All files', extensions: ['*'] }],
    });
    if (picked.canceled) return { canceled: true };
    const filePath = picked.paths[0];
    let bytes = null;
    try { bytes = fs.statSync(filePath).size; } catch (_) {}
    return { canceled: false, filePath, bytes };
  }

  fromUrl(args, send) {
    return ImageDownloadSlot.reportingFailures(send, () => this._fromUrl(args || {}, send));
  }

  fromFile(args, send) {
    return ImageDownloadSlot.reportingFailures(send, () => this._fromFile(args || {}, send));
  }

  fromRepo(args, send) {
    return ImageDownloadSlot.reportingFailures(send, () => this._fromRepo(args || {}, send));
  }

  fromCivitai(args, send) {
    return ImageDownloadSlot.reportingFailures(send, () => this._fromCivitai(args || {}, send));
  }

  resolveCivitai(args) {
    return this._civitaiResolver().resolve(args || {});
  }

  async _fromUrl(args, send) {
    const synth = ImportedEntryBuilder.build({
      name: args.name, url: args.url, baseType: args.baseType, loaderFlag: args.loaderFlag,
      kind: args.kind, approxBytes: args.approxBytes, promptStyle: args.promptStyle,
    });
    if (synth.error) return { success: false, error: synth.error };
    return this._downloadEntry(synth.entry, send);
  }

  async _fromCivitai(args, send) {
    const resolved = await this.resolveCivitai(args);
    if (resolved.error) return { success: false, error: resolved.error };
    const { entry, file } = resolved;
    let derivation = null;
    const result = await this._downloadEntry(entry, send, CivitaiModelResolver.expectations(file), {
      onStarted: () => { derivation = this._deriveRecipe(resolved, send); },
      finalize: async () => {
        const derived = derivation ? await derivation : null;
        if (derived) CivitaiRecipe.apply(entry, derived);
      },
    });
    return result.success ? { ...result, civitai: entry.civitai } : result;
  }

  async _deriveRecipe({ model, version, map, entry }, send) {
    if (!this._recipes) return null;
    send('recipe', { id: entry.id, stage: 'reading' });
    try {
      const derived = await this._recipes.derive({ model, version, map, entry });
      send('recipe', { id: entry.id, stage: 'done', defaults: derived.defaults, sources: derived.sources, warnings: derived.warnings, imageSamples: derived.images ? derived.images.samples : 0 });
      return derived;
    } catch (err) {
      send('recipe', { id: entry.id, stage: 'failed', error: (err && err.message) || String(err) });
      return null;
    }
  }

  _downloadEntry(entry, send, expectations = {}, { onStarted = null, finalize = null } = {}) {
    const { modelsDir, dir } = this._target(entry.id);
    const missing = ImportCompanions.check(entry, dir, modelsDir);
    if (missing) return Promise.resolve({ success: false, error: missing.error });
    const files = [{ role: 'diffusion', url: entry.files.diffusion.url, destPath: path.join(dir, entry.files.diffusion.file), ...expectations }];
    const wasBusy = this._slot.busy;
    const pending = this._slot.run({
      files,
      dir,
      send,
      start: { id: entry.id, dir, files: ImageDownloadSlot.startFiles(files) },
      onDownloaded: async () => {
        const refusal = ImageModelImporter._allInOneRefusal(entry, path.join(dir, entry.files.diffusion.file))
          || ImageModelImporter._companionFailure(entry, dir, modelsDir);
        if (refusal) return ImageModelImporter._fail(send, refusal);
        if (finalize) await finalize();
        return ImageModelImporter._finishImport(send, entry, dir);
      },
    });
    if (onStarted && !wasBusy) onStarted();
    return pending;
  }

  async _fromFile(args, send) {
    const synth = ImportedEntryBuilder.build({
      name: args.name, srcPath: args.filePath, baseType: args.baseType, loaderFlag: args.loaderFlag,
      kind: args.kind, promptStyle: args.promptStyle,
    });
    if (synth.error) return { success: false, error: synth.error };
    const { entry } = synth;
    const early = ImageModelImporter._allInOneRefusal(entry, args.filePath);
    if (early) return ImageModelImporter._fail(send, early);
    const { modelsDir, dir } = this._target(entry.id);
    const missing = ImportCompanions.check(entry, dir, modelsDir);
    if (missing) return { success: false, error: missing.error };
    const destPath = path.join(dir, entry.files.diffusion.file);
    await ImageModelImporter._copyIn(args.filePath, destPath, entry.id, dir, send);
    const failure = ImageModelImporter._companionFailure(entry, dir, modelsDir);
    if (failure) return ImageModelImporter._fail(send, failure);
    ImageModelManifest.writeQuietly(dir, ImageManifestBuilder.forImport(entry), 'import manifest');
    send('file-done', { role: 'diffusion', destPath, bytes: fs.statSync(destPath).size });
    send('done', { id: entry.id, dir });
    return { success: true, id: entry.id, dir };
  }

  async _fromRepo(args, send) {
    const repo = HfRepoRecipes.parseRepoUrl(args.url);
    if (!repo) return { success: false, error: ImageModelImporter.REPO_URL_HINT };
    const listed = await this._listRepo(repo.id);
    if (listed.error) return { success: false, error: listed.error };
    const recipe = HfRepoRecipes.resolve(repo.id, listed.files, this._catalog, listed.listing);
    if (recipe.error) return { success: false, error: recipe.error };
    const { entry } = recipe;
    const { dir } = this._target(entry.id);
    const files = CatalogModelInstaller.downloadList(entry.files, dir);
    return this._slot.run({
      files,
      dir,
      send,
      start: { id: entry.id, dir, files: ImageDownloadSlot.startFiles(files) },
      onDownloaded: () => {
        ImageModelManifest.writeQuietly(dir, ImageManifestBuilder.forRepo(entry), 'repo manifest');
        send('done', { id: entry.id, dir });
        return { success: true, id: entry.id, dir, resolved: entry.resolvedNote || null };
      },
    });
  }

  async _listRepo(repoId) {
    try {
      const answer = await this._fetchSiblings(repoId);
      if (Array.isArray(answer)) return { files: answer, listing: null };
      return { files: (answer && answer.names) || [], listing: answer || null };
    } catch (err) {
      return { error: `Could not read the HuggingFace repo "${repoId}": ${err.message}` };
    }
  }

  _civitaiResolver() {
    if (!this._civitai) this._civitai = new CivitaiModelResolver();
    return this._civitai;
  }

  _target(id) {
    const modelsDir = this._svc.getModelsDirConfig().effectivePath;
    return { modelsDir, dir: path.join(modelsDir, id) };
  }

  static async _copyIn(srcPath, destPath, id, dir, send) {
    send('start', { id, dir, files: [{ role: 'diffusion', file: path.basename(destPath) }] });
    send('file-start', { role: 'diffusion', file: path.basename(destPath), destPath, index: 0, total: 1 });
    fs.mkdirSync(dir, { recursive: true });
    await FileCopyProgress.copy(srcPath, destPath, (received, total) => send('download', { role: 'diffusion', received, total }));
  }

  static _allInOneRefusal(entry, filePath) {
    if (entry.baseType !== 'anima' || !AllInOneCheckpoint.hasBakedVaeOrClip(filePath)) return null;
    return AllInOneCheckpoint.ANIMA_ERROR;
  }

  static _companionFailure(entry, dir, modelsDir) {
    const attached = ImportCompanions.attach(entry, dir, modelsDir);
    return attached && attached.error ? attached.error : null;
  }

  static _finishImport(send, entry, dir) {
    ImageModelManifest.writeQuietly(dir, ImageManifestBuilder.forImport(entry), 'import manifest');
    send('done', { id: entry.id, dir });
    return { success: true, id: entry.id, dir };
  }

  static _fail(send, message) {
    send('error', { message });
    return { success: false, error: message };
  }
}

module.exports = ImageModelImporter;
