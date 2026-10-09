class ArtifactCatalog {
  static HEADER = '[Artifacts created earlier in THIS conversation; you can pass these ids to edit_image, etc.:\n';
  static HISTORY_NOTE = '\n  Every version is kept. An edit builds ONLY on the version id you pass. If the user'
    + ' rejects the last edit ("no, not like that", "undo that", "instead…"), edit the'
    + ' version BEFORE it, not the latest, or the mistake is carried into the new result.';

  static collect(priorMessages) {
    const byRoot = new Map();
    let order = 0;
    for (const artifact of ArtifactCatalog._artifactsOf(priorMessages)) {
      const rootId = artifact.rootId || artifact.id;
      const version = typeof artifact.version === 'number' ? artifact.version : 1;
      const prev = byRoot.get(rootId);
      if (!prev) {
        byRoot.set(rootId, ArtifactCatalog._entry(artifact, version, order++, [{ id: artifact.id, version }]));
        continue;
      }
      if (!prev.versions.some((v) => v.id === artifact.id)) prev.versions.push({ id: artifact.id, version });
      if (version >= prev.version) byRoot.set(rootId, ArtifactCatalog._entry(artifact, version, prev.order, prev.versions));
    }
    return [...byRoot.values()].sort((x, y) => x.order - y.order).map(ArtifactCatalog._publicEntry);
  }

  static render(catalog) {
    if (!catalog.length) return '';
    const anyHistory = catalog.some((a) => Array.isArray(a.versions) && a.versions.length > 1);
    return ArtifactCatalog.HEADER
      + catalog.map(ArtifactCatalog._line).join('\n')
      + (anyHistory ? ArtifactCatalog.HISTORY_NOTE : '')
      + ']\n\n';
  }

  static _artifactsOf(priorMessages) {
    const out = [];
    for (const m of (priorMessages || [])) {
      const tc = m && m.toolCalls;
      if (!tc || !Array.isArray(tc.artifacts)) continue;
      for (const a of tc.artifacts) if (a && a.id) out.push(a);
    }
    return out;
  }

  static _entry(artifact, version, order, versions) {
    return { id: artifact.id, type: artifact.type || 'artifact', title: artifact.title || '', version, order, versions };
  }

  static _publicEntry({ id, type, title, versions }) {
    const out = { id, type, title };
    if (versions.length > 1) out.versions = versions.slice().sort((x, y) => x.version - y.version);
    return out;
  }

  static _line(a) {
    const line = '  - ' + a.type + ' "' + (a.title || 'untitled') + '" → id `' + a.id + '`';
    if (!Array.isArray(a.versions) || a.versions.length < 2) return line;
    const latest = a.versions[a.versions.length - 1];
    const earlier = a.versions.slice(0, -1).reverse().map((v) => 'v' + v.version + ' `' + v.id + '`').join(', ');
    return line + ' (v' + latest.version + ', latest; earlier versions: ' + earlier + ')';
  }
}

module.exports = ArtifactCatalog;
