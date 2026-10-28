class EditRegionIndex {
  static collect(priorMessages) {
    const messages = Array.isArray(priorMessages) ? priorMessages : [];
    let newestUser = -1;
    messages.forEach((m, i) => { if (m && m.role === 'user') newestUser = i; });
    const regions = [];
    messages.forEach((m, i) => {
      const rows = m && m.toolCalls && Array.isArray(m.toolCalls.editRegions) ? m.toolCalls.editRegions : [];
      for (const row of rows) {
        if (row && row.id && row.artifactId) regions.push({ ...row, current: i === newestUser });
      }
    });
    return new EditRegionIndex(regions);
  }

  constructor(regions = []) {
    this._regions = regions;
    this._byId = new Map(regions.map((r) => [r.id, r]));
  }

  get(id) {
    return (id && this._byId.get(String(id))) || null;
  }

  list() {
    return this._regions.slice();
  }

  forArtifact(artifactId) {
    return this._regions.filter((r) => r.artifactId === artifactId);
  }

  currentFor(artifactId) {
    const current = this.forArtifact(artifactId).filter((r) => r.current);
    return current.length ? current[current.length - 1] : null;
  }

  get size() {
    return this._regions.length;
  }
}

module.exports = EditRegionIndex;
