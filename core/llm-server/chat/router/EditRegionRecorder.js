const RecordId = require('../../../database/RecordId');

class EditRegionRecorder {
  static ID_PREFIX = 'rgn';
  static MAX_NOTE_CHARS = 400;
  static MAX_TITLE_CHARS = 120;
  static MAX_MASK_CHARS = 4 * 1024 * 1024;
  static PNG_BASE64_PREFIX = 'iVBORw0KGgo';

  constructor({ chatStore }) {
    this._store = chatStore;
  }

  record({ attachments, images, artifacts, userRow }) {
    if (!userRow) return [];
    const regions = EditRegionRecorder.collect(attachments, images, artifacts);
    if (!regions.length) return [];
    try {
      this._store.updateMessage(userRow.id, { toolCalls: { artifacts: artifacts || [], editRegions: regions } });
    } catch (_) {
      return [];
    }
    return regions.map(EditRegionRecorder.publicRow);
  }

  static collect(attachments, images = [], artifacts = []) {
    const out = [];
    for (const entry of (Array.isArray(attachments) ? attachments : [])) {
      if (!entry) continue;
      if (entry.kind === 'region') {
        const row = EditRegionRecorder.fromStaged(entry, entry.artifactId, entry.title);
        if (row) out.push(row);
      } else if (entry.kind === 'image' && entry.region) {
        const art = EditRegionRecorder._artifactFor(entry, images, artifacts);
        const row = art && EditRegionRecorder.fromStaged(entry.region, art.id, art.title || entry.name);
        if (row) out.push(row);
      }
    }
    return out;
  }

  static fromStaged(entry, artifactId, title) {
    if (!entry || typeof entry !== 'object') return null;
    const mask = typeof entry.mask === 'string' ? entry.mask.replace(/^data:[^,]*,/, '').replace(/\s+/g, '') : '';
    if (!mask.startsWith(EditRegionRecorder.PNG_BASE64_PREFIX) || mask.length > EditRegionRecorder.MAX_MASK_CHARS) return null;
    if (typeof artifactId !== 'string' || !artifactId.trim()) return null;
    const width = EditRegionRecorder._positiveInt(entry.width);
    const height = EditRegionRecorder._positiveInt(entry.height);
    if (!width || !height) return null;
    const coverage = Number(entry.coverage);
    return {
      id: RecordId.create(EditRegionRecorder.ID_PREFIX),
      artifactId: artifactId.trim(),
      title: EditRegionRecorder._text(title, EditRegionRecorder.MAX_TITLE_CHARS),
      note: EditRegionRecorder._text(entry.note, EditRegionRecorder.MAX_NOTE_CHARS),
      mask,
      coverage: Number.isFinite(coverage) ? Math.max(0, Math.min(1, coverage)) : null,
      width,
      height,
    };
  }

  static publicRow({ id, artifactId, title, note, coverage, width, height }) {
    return { id, artifactId, title, note, coverage, width, height };
  }

  static _artifactFor(image, images, artifacts) {
    const index = images.indexOf(image);
    if (index >= 0 && images.length === artifacts.length) return artifacts[index] || null;
    return artifacts.find((a) => a && a.title === image.name) || null;
  }

  static _positiveInt(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  static _text(value, max) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
  }
}

module.exports = EditRegionRecorder;
