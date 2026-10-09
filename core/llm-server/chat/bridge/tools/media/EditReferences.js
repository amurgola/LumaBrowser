const EditProfiles = require('../../../../../image-server/prompt/EditProfiles');
const ArtifactId = require('../artifacts/ArtifactId');

class EditReferences {
  static MAX = EditProfiles.DEFAULT_MAX_REFERENCES;
  static MAX_USE_CHARS = 80;

  static resolve({ params, artifactStore, sourceId, max = EditReferences.MAX }) {
    const refs = [];
    const seen = new Set([sourceId]);
    let dropped = 0;
    for (const entry of EditReferences._entries(params)) {
      const id = typeof entry === 'string' ? entry.trim() : ArtifactId.from(entry);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      if (refs.length >= max) { dropped += 1; continue; }
      const art = artifactStore.get(id);
      const error = EditReferences._problem(id, art);
      if (error) return { refs, dropped, error };
      refs.push({ id, use: EditReferences._use(entry), content: art.content });
    }
    return { refs, dropped };
  }

  static _entries(params) {
    const raw = params && (params.references || params.referenceArtifactIds || params.reference_artifact_ids);
    if (Array.isArray(raw)) return raw;
    return raw ? [raw] : [];
  }

  static _problem(id, art) {
    if (!art) return `edit_image: reference artifact "${id}" not found.`;
    if ((art.type || '') !== 'image') return `edit_image: reference artifact "${id}" is a ${art.type}, not an image.`;
    if (!art.content) return `edit_image: reference artifact "${id}" has no image bytes.`;
    return null;
  }

  static _use(entry) {
    const raw = entry && typeof entry === 'object' ? (entry.use || entry.role || entry.for) : '';
    return typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, EditReferences.MAX_USE_CHARS) : '';
  }
}

module.exports = EditReferences;
