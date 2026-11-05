const CivitaiClient = require('./CivitaiClient');
const CivitaiBaseMap = require('./CivitaiBaseMap');
const ImportedEntryBuilder = require('../ipc/ImportedEntryBuilder');

class CivitaiModelResolver {
  static PAGE_URL = /^https?:\/\/(?:www\.)?civitai\.com\/models\/(\d+)(?:\/|\?|#|$)/i;

  static DOWNLOAD_URL = /^https?:\/\/(?:www\.)?civitai\.com\/api\/download\/models\/(\d+)(?:\/|\?|#|$)/i;

  static VERSION_PARAM = 'modelVersionId';

  static URL_HINT = 'Paste a CivitAI model page URL, e.g. https://civitai.com/models/376130?modelVersionId=2940478';

  static NOT_A_CHECKPOINT = (type) => `This CivitAI model is a ${type || 'non-checkpoint asset'}, not a checkpoint. `
    + (CivitaiBaseMap.assetKind(type) === 'lora' ? 'LoRAs go into the LoRA library instead.' : 'Only checkpoints can be imported as image models.');

  static COMMERCIAL_TERMS = Object.freeze({
    Image: 'selling generated images', RentCivit: 'generation on CivitAI', Rent: 'generation services', Sell: 'selling the model',
  });

  constructor({ client = new CivitaiClient(), now = () => new Date() } = {}) {
    this._client = client;
    this._now = now;
  }

  static parseUrl(url) {
    const text = String(url || '').trim();
    const page = CivitaiModelResolver.PAGE_URL.exec(text);
    if (page) {
      let versionId = null;
      try { versionId = CivitaiModelResolver._int(new URL(text).searchParams.get(CivitaiModelResolver.VERSION_PARAM)); } catch (_) {}
      return { modelId: Number(page[1]), versionId };
    }
    const download = CivitaiModelResolver.DOWNLOAD_URL.exec(text);
    if (download) return { modelId: null, versionId: Number(download[1]) };
    return null;
  }

  async resolve(args = {}) {
    const ids = CivitaiModelResolver._ids(args);
    if (ids.error) return { error: ids.error };
    let { modelId, versionId } = ids;
    try {
      if (!modelId) {
        const read = await this._client.getVersion(versionId);
        modelId = read.modelId;
      }
      const model = await this._client.getModel(modelId);
      const version = CivitaiModelResolver._version(model, versionId);
      if (!version) return { error: versionId ? `CivitAI model ${modelId} has no version ${versionId}.` : `CivitAI model ${modelId} has no published versions.` };
      if (model.type !== 'Checkpoint') return { error: CivitaiModelResolver.NOT_A_CHECKPOINT(model.type) };
      const map = CivitaiBaseMap.resolve(version.baseModel);
      if (!map.supported) return { error: map.note };
      const file = CivitaiModelResolver.pickFile(version, args.fileId);
      if (!file) return { error: `CivitAI version ${version.id} has no downloadable model file.` };
      const built = CivitaiModelResolver.buildEntry({ model, version, file, map, now: this._now() });
      if (built.error) return { error: built.error };
      return { model, version, file, map, entry: built.entry };
    } catch (err) {
      return { error: `Could not read the CivitAI model: ${(err && err.message) || String(err)}` };
    }
  }

  static pickFile(version, fileId) {
    const files = (Array.isArray(version && version.files) ? version.files : []).filter((f) => f && f.type === 'Model');
    const wanted = CivitaiModelResolver._int(fileId);
    if (wanted) return files.find((f) => f.id === wanted) || null;
    return files.find((f) => f.primary) || files[0] || null;
  }

  static buildEntry({ model, version, file, map, now = new Date() }) {
    const name = CivitaiModelResolver.displayName(model, version);
    const bytes = CivitaiModelResolver.bytesOf(file);
    const built = ImportedEntryBuilder.build({
      name,
      url: CivitaiClient.downloadUrl(version.id, { fileId: file.id }),
      baseType: map.baseType,
      kind: map.kind,
      promptStyle: map.profile || undefined,
      fileName: file.name,
      defaults: map.recipe || undefined,
      ...(bytes ? { approxBytes: bytes } : {}),
    });
    if (built.error) return built;
    const { entry } = built;
    entry.family = map.family || entry.family;
    entry.licenseNote = CivitaiModelResolver.licenseNote(model) || entry.licenseNote;
    entry.civitai = CivitaiModelResolver.origin({ model, version, file, now });
    return { entry };
  }

  static displayName(model, version) {
    const modelName = String((model && model.name) || '').trim();
    const versionName = String((version && version.name) || '').trim();
    if (!versionName || modelName.toLowerCase().includes(versionName.toLowerCase())) return modelName || versionName;
    return `${modelName} ${versionName}`.trim();
  }

  static bytesOf(file) {
    const kb = Number(file && file.sizeKB);
    if (!Number.isFinite(kb) || kb <= 0) return null;
    const bytes = kb * 1024;
    return Number.isInteger(bytes) ? bytes : null;
  }

  static expectations(file) {
    const sha256 = file && file.hashes && typeof file.hashes.SHA256 === 'string' ? file.hashes.SHA256.toLowerCase() : null;
    const bytes = CivitaiModelResolver.bytesOf(file);
    return { ...(bytes ? { expectedSize: bytes } : {}), ...(sha256 ? { expectedSha256: sha256 } : {}) };
  }

  static origin({ model, version, file, now = new Date() }) {
    const hashes = (file && file.hashes) || {};
    return {
      modelId: model.id,
      versionId: version.id,
      fileId: file.id,
      modelName: model.name,
      versionName: version.name || null,
      type: model.type,
      baseModel: version.baseModel || null,
      fileName: file.name,
      sha256: typeof hashes.SHA256 === 'string' ? hashes.SHA256.toLowerCase() : null,
      blake3: typeof hashes.BLAKE3 === 'string' ? hashes.BLAKE3.toLowerCase() : null,
      trainedWords: Array.isArray(version.trainedWords) ? version.trainedWords.filter((w) => typeof w === 'string') : [],
      nsfw: !!model.nsfw,
      creator: (model.creator && model.creator.username) || null,
      pageUrl: `https://civitai.com/models/${model.id}?${CivitaiModelResolver.VERSION_PARAM}=${version.id}`,
      fetchedAt: now.toISOString(),
    };
  }

  static licenseNote(model) {
    if (!model || typeof model !== 'object') return null;
    const parts = [];
    const raw = model.allowCommercialUse;
    if (raw !== undefined && raw !== null) {
      const list = (Array.isArray(raw) ? raw : [raw]).filter((v) => typeof v === 'string' && v !== 'None');
      const named = list.map((v) => CivitaiModelResolver.COMMERCIAL_TERMS[v] || v.toLowerCase());
      parts.push(named.length ? `commercial use allowed for ${named.join(', ')}` : 'no commercial use');
    }
    if (typeof model.allowNoCredit === 'boolean') parts.push(model.allowNoCredit ? 'no credit required' : 'credit required');
    if (typeof model.allowDerivatives === 'boolean') {
      parts.push(model.allowDerivatives
        ? (model.allowDifferentLicense === false ? 'derivatives allowed under the same terms' : 'derivatives allowed')
        : 'no merges or derivatives');
    }
    return parts.length ? `CivitAI licence terms set by the creator: ${parts.join('; ')}.` : null;
  }

  static ids(args) {
    return CivitaiModelResolver._ids(args || {});
  }

  static versionOf(model, versionId) {
    return CivitaiModelResolver._version(model, versionId);
  }

  static _ids(args) {
    const fromUrl = args.url ? CivitaiModelResolver.parseUrl(args.url) : null;
    if (args.url && !fromUrl) return { error: CivitaiModelResolver.URL_HINT };
    const modelId = CivitaiModelResolver._int(args.modelId) || (fromUrl && fromUrl.modelId) || null;
    const versionId = CivitaiModelResolver._int(args.versionId) || (fromUrl && fromUrl.versionId) || null;
    if (!modelId && !versionId) return { error: CivitaiModelResolver.URL_HINT };
    return { modelId, versionId };
  }

  static _version(model, versionId) {
    const versions = Array.isArray(model && model.modelVersions) ? model.modelVersions.filter(Boolean) : [];
    if (versionId) return versions.find((v) => v.id === versionId) || null;
    return versions[0] || null;
  }

  static _int(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  }
}

module.exports = CivitaiModelResolver;
