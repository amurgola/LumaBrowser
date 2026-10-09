const ArtifactId = require('../artifacts/ArtifactId');
const ChatToolHandler = require('./ChatToolHandler');

class ArtifactDataHandler extends ChatToolHandler {
  static UNAVAILABLE = 'Artifact data is not available.';
  static SAVED = 'Saved. The widget UI updates from this data automatically.';

  names() {
    return ['get_artifact_data', 'update_artifact_data'];
  }

  async execute(name, params, ctx) {
    const store = ctx.deps.artifactDataStore;
    if (!store) return { success: false, error: ArtifactDataHandler.UNAVAILABLE };
    const artifactId = ArtifactId.from(params);
    if (!artifactId) return { success: false, error: `${name} requires "artifactId".` };
    if (name === 'get_artifact_data') return store.all(artifactId);
    return ArtifactDataHandler._update(store, artifactId, params);
  }

  static _update(store, artifactId, params) {
    const result = store.mutate(artifactId, { set: params && params.set, remove: params && params.remove });
    if (!result.success) return result;
    return { success: true, rev: result.rev, keys: result.keys, message: ArtifactDataHandler.SAVED };
  }
}

module.exports = ArtifactDataHandler;
