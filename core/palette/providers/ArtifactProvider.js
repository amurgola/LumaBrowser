const PaletteMatcher = require('../PaletteMatcher');

class ArtifactProvider {
  static TYPE_LABELS = {
    html: 'Page', svg: 'Drawing', markdown: 'Document', code: 'Code', image: 'Image', video: 'Video', audio: 'Audio', live: 'Widget',
  };
  static LIST_LIMIT = 500;

  constructor({ getArtifactStore }) {
    this._getStore = getArtifactStore;
  }

  search(query, { limit = 5 } = {}) {
    const store = this._getStore();
    if (!store) return [];
    const hits = [];
    for (const a of store.listAllRoots({ limit: ArtifactProvider.LIST_LIMIT })) {
      const m = PaletteMatcher.score(query, [
        { text: a.title, weight: 1 },
        { text: `${ArtifactProvider.typeLabel(a.type)} ${a.language || ''}`, weight: 0.6 },
        { text: a.conversationTitle, weight: 0.5 },
      ]);
      if (m) hits.push({ a, m });
    }
    hits.sort((x, y) => y.m.score - x.m.score);
    return hits.slice(0, limit).map(({ a, m }) => ArtifactProvider.item(a, m.score, m.marks));
  }

  static typeLabel(type) {
    return ArtifactProvider.TYPE_LABELS[type] || 'Artifact';
  }

  static item(a, score = 0, marks = []) {
    const from = a.conversationTitle && !a.orphaned ? ` from "${a.conversationTitle}"` : '';
    return {
      kind: 'artifact',
      id: a.rootId || a.id,
      title: a.title || 'Artifact',
      subtitle: `${ArtifactProvider.typeLabel(a.type)}${from}`,
      marks,
      score,
      data: { artifactId: a.id, conversationId: a.orphaned ? null : (a.conversationId || null), type: a.type },
    };
  }
}

module.exports = ArtifactProvider;
