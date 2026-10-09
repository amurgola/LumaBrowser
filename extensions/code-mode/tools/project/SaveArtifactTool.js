const path = require('path');
const CodeTool = require('../CodeTool');
const ArtifactFile = require('./ArtifactFile');

class SaveArtifactTool extends CodeTool {
  constructor({ workspace, getArtifactStore }) {
    super();
    this._workspace = workspace;
    this._getArtifactStore = getArtifactStore;
  }

  get name() {
    return 'save_artifact';
  }

  get description() {
    return 'Save an ARTIFACT from this conversation as a file in the project. An artifact is '
      + 'something a tool produced during the chat, and it is one of two things: an IMAGE (the output '
      + 'of generate_image / edit_image, written as its raw PNG/JPEG bytes) or a TEXT artifact (html, '
      + 'svg, markdown, code, or a live module, written as UTF-8 text). Artifacts live only in the chat '
      + 'until saved: nothing reaches the project folder without this call, so after generating an '
      + 'image you need in the project, call save_artifact with its artifact id. `path` is relative to '
      + 'the project root; if it has no extension the artifact\'s natural one is appended (.png, .svg, '
      + '.md, …). Pass artifactId "latest" for the most recent artifact. Overwriting an existing file '
      + 'requires overwrite: true. Note that if you also have write_file, it writes ONLY text you '
      + 'compose yourself; save_artifact is the only way to place an image or an existing artifact.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        artifactId: { type: 'string', description: 'The artifact id from the tool that created it, or "latest".' },
        path: { type: 'string', description: 'Destination path relative to the project root, e.g. assets/sprites/hero.png' },
        overwrite: { type: 'boolean', description: 'Replace the file if it already exists (default false).' },
      },
      required: ['artifactId', 'path'],
    };
  }

  get mutating() {
    return true;
  }

  async handle(params, opts = {}) {
    const s = this._workspace.begin();
    const relPath = params && typeof params.path === 'string' ? params.path.trim() : '';
    if (!relPath) return { success: false, error: 'path is required' };
    const store = this._getArtifactStore();
    if (!store) return { success: false, error: 'Artifacts are not available in this session.' };
    const found = this._findArtifact(store, params);
    if (found.error) return { success: false, error: found.error };
    const payload = ArtifactFile.payloadOf(found.art, store);
    if (payload.error) return { success: false, error: payload.error };
    return this._save(s, found.art, payload, SaveArtifactTool._target(relPath, found.art), params.overwrite === true, opts.emit);
  }

  _findArtifact(store, params) {
    let list = [];
    try { list = store.list(this._workspace.conversationId) || []; } catch (_) { list = []; }
    const rawId = params && params.artifactId != null ? String(params.artifactId).trim() : '';
    if (!rawId || rawId.toLowerCase() === 'latest') {
      const last = list[list.length - 1];
      const art = last ? store.get(last.id) : null;
      return art ? { art } : { error: `No artifact to save. ${ArtifactFile.describeAll(list)}` };
    }
    const art = store.get(rawId);
    return art ? { art } : { error: `Artifact "${rawId}" not found. ${ArtifactFile.describeAll(list)}` };
  }

  async _save(s, art, payload, target, overwrite, emit) {
    let res;
    try {
      res = await this._workspace.code.writeBytes(s.workspaceId, target, payload.bytes, { overwrite });
    } catch (err) {
      return { success: false, error: err.message, message: `Save failed: ${err.message}` };
    }
    if (!res.ok) return { success: false, error: res.error, message: `Save failed: ${res.error}` };
    this._workspace.trackFile(s, res.path, true);
    this._workspace.emitState(emit, s);
    return SaveArtifactTool._result(art, payload, res);
  }

  static _target(relPath, art) {
    return path.posix.extname(relPath.replace(/\\/g, '/')) ? relPath : `${relPath}.${ArtifactFile.extensionOf(art)}`;
  }

  static _result(art, payload, res) {
    const what = payload.kind === 'text' ? `${art.type} artifact` : payload.kind;
    return {
      success: true,
      path: res.path,
      bytes: res.bytes,
      artifactId: art.id,
      type: art.type,
      message: `Saved ${what} "${art.title || art.id}" to ${res.path} (${res.bytes} bytes${res.created ? '' : ', replaced'}).`,
      summary: `${res.path} · ${res.bytes} bytes`,
    };
  }
}

module.exports = SaveArtifactTool;
