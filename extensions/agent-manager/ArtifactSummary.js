class ArtifactSummary {
  static of(a) {
    if (!a || !a.id) return null;
    return {
      id: a.id,
      title: a.title || 'Artifact',
      type: a.type || 'artifact',
      version: typeof a.version === 'number' ? a.version : 1,
      url: a.url || null,
    };
  }

  static list(artifacts) {
    return (artifacts || []).map((a) => ArtifactSummary.of(a));
  }
}

module.exports = ArtifactSummary;
