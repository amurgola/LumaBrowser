const HtmlToMarkdown = require('../../shared/content/HtmlToMarkdown');
const CivitaiBaseMap = require('./CivitaiBaseMap');
const CivitaiModelResolver = require('./CivitaiModelResolver');

class CivitaiSearchView {
  static MAX_VERSIONS = 6;

  static DETAIL_VERSIONS = 12;

  static MAX_TAGS = 8;

  static DETAIL_IMAGES = 4;

  static DESCRIPTION_MAX_CHARS = 64 * 1024;

  static SAFE_IMAGE_LEVELS = 3;

  static THUMB_WIDTH = 320;

  static IMAGE_WIDTH = 450;

  static page(page) {
    const items = ((page && page.items) || []).map((m) => CivitaiSearchView.row(m)).filter(Boolean);
    return { items, nextCursor: (page && page.nextCursor) || null };
  }

  static row(model, { maxVersions = CivitaiSearchView.MAX_VERSIONS } = {}) {
    if (!model || !Array.isArray(model.modelVersions) || model.modelVersions.length === 0) return null;
    const assetKind = CivitaiBaseMap.assetKind(model.type);
    const versions = model.modelVersions.filter(Boolean).slice(0, maxVersions).map((v) => CivitaiSearchView.version(v, model));
    const stats = model.stats || {};
    return {
      modelId: model.id,
      name: String(model.name || `Model ${model.id}`),
      type: model.type || null,
      assetKind,
      installableType: CivitaiBaseMap.isInstallableType(model.type),
      nsfw: !!model.nsfw,
      creator: (model.creator && model.creator.username) || null,
      tags: (Array.isArray(model.tags) ? model.tags : []).filter((t) => typeof t === 'string').slice(0, CivitaiSearchView.MAX_TAGS),
      downloads: Number(stats.downloadCount) || 0,
      likes: Number(stats.thumbsUpCount) || 0,
      thumbnail: CivitaiSearchView.thumbnail(model),
      pageUrl: `https://civitai.com/models/${model.id}`,
      versions,
    };
  }

  static version(version, model) {
    const map = CivitaiBaseMap.resolve(version.baseModel);
    const file = CivitaiModelResolver.pickFile(version);
    const checkpoint = (model && model.type) === 'Checkpoint';
    const installable = checkpoint && map.supported && !!file;
    let reason = null;
    if (!checkpoint) reason = CivitaiBaseMap.assetKind(model && model.type) === 'lora' ? 'LoRA: install from the LoRA library (coming next).' : `${(model && model.type) || 'This asset'} is not a checkpoint.`;
    else if (!map.supported) reason = map.note;
    else if (!file) reason = 'No downloadable model file.';
    return {
      versionId: version.id,
      name: version.name || null,
      baseModel: version.baseModel || null,
      publishedAt: version.publishedAt || null,
      downloads: Number(version.stats && version.stats.downloadCount) || 0,
      installable,
      reason,
      baseType: map.baseType,
      profile: map.profile,
      kind: map.kind,
      family: map.family,
      earlyAccess: !!(version.availability && version.availability !== 'Public') || !!version.earlyAccessEndsAt,
      file: file ? CivitaiSearchView.file(file) : null,
      trainedWords: Array.isArray(version.trainedWords) ? version.trainedWords.filter((w) => typeof w === 'string').slice(0, 10) : [],
    };
  }

  static file(file) {
    const meta = file.metadata || {};
    return {
      fileId: file.id,
      name: file.name || null,
      bytes: CivitaiModelResolver.bytesOf(file) || (Number(file.sizeKB) > 0 ? Math.round(Number(file.sizeKB) * 1024) : null),
      format: meta.format || null,
      fp: meta.fp || null,
      size: meta.size || null,
      sha256: file.hashes && typeof file.hashes.SHA256 === 'string' ? file.hashes.SHA256.toLowerCase() : null,
    };
  }

  static thumbnail(model) {
    for (const version of model.modelVersions || []) {
      const [first] = CivitaiSearchView.images(version, 1, CivitaiSearchView.THUMB_WIDTH);
      if (first) return first;
    }
    return null;
  }

  static images(version, limit = CivitaiSearchView.DETAIL_IMAGES, width = CivitaiSearchView.IMAGE_WIDTH) {
    const out = [];
    for (const image of (version && version.images) || []) {
      if (!image || typeof image.url !== 'string') continue;
      if (image.type && image.type !== 'image') continue;
      const level = Number(image.nsfwLevel);
      if (Number.isFinite(level) && level > CivitaiSearchView.SAFE_IMAGE_LEVELS) continue;
      out.push({ url: CivitaiSearchView.resize(image.url, width), width: image.width || null, height: image.height || null });
      if (out.length >= limit) break;
    }
    return out;
  }

  static resize(url, width) {
    return String(url).replace(/\/(original=true|width=\d+)\//, `/width=${width}/`);
  }

  static detail(model, { versionId = null, fileId = null, now = new Date() } = {}) {
    const row = CivitaiSearchView.row(model, { maxVersions: CivitaiSearchView.DETAIL_VERSIONS });
    if (!row) return null;
    const raw = CivitaiModelResolver.versionOf(model, versionId) || CivitaiModelResolver.versionOf(model, null);
    const version = row.versions.find((v) => v.versionId === raw.id) || CivitaiSearchView.version(raw, model);
    const entry = version.installable ? CivitaiSearchView._entry(model, raw, fileId, now) : null;
    return {
      ...row,
      versionId: version.versionId,
      version,
      fileId: version.file ? version.file.fileId : null,
      label: entry ? entry.label : CivitaiModelResolver.displayName(model, raw),
      defaults: entry ? entry.defaults : null,
      licenseNote: entry ? entry.licenseNote || null : null,
      trainedWords: version.trainedWords,
      images: CivitaiSearchView.images(raw),
      description: CivitaiSearchView.description(model, raw),
      pageUrl: `https://civitai.com/models/${model.id}?modelVersionId=${version.versionId}`,
    };
  }

  static description(model, version) {
    const parts = [];
    const notes = version && version.description ? HtmlToMarkdown.convert(String(version.description)).trim() : '';
    const page = model && model.description ? HtmlToMarkdown.convert(String(model.description)).trim() : '';
    if (notes) parts.push(`### Version notes\n\n${notes}`);
    if (page) parts.push(notes ? `### About this model\n\n${page}` : page);
    const joined = parts.join('\n\n');
    return joined.length > CivitaiSearchView.DESCRIPTION_MAX_CHARS ? `${joined.slice(0, CivitaiSearchView.DESCRIPTION_MAX_CHARS)}\n\n(truncated)` : joined;
  }

  static _entry(model, version, fileId, now) {
    const map = CivitaiBaseMap.resolve(version.baseModel);
    const file = CivitaiModelResolver.pickFile(version, fileId);
    if (!map.supported || !file) return null;
    const built = CivitaiModelResolver.buildEntry({ model, version, file, map, now });
    return built.error ? null : built.entry;
  }
}

module.exports = CivitaiSearchView;
