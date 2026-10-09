class ArtifactId {
  static from(params) {
    if (!params) return undefined;
    return params.artifactId || params.artifact_id || params.id || params.imageId;
  }
}

module.exports = ArtifactId;
