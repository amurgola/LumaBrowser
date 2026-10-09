const fs = require('fs');
const path = require('path');

class GroundingRecommendedModels {
  static RECOMMENDED = Object.freeze([
    {
      id: 'holo-3.1-9b', label: 'Holo 3.1 9B (recommended)', repo: 'mradermacher/Holo-3.1-9B-GGUF',
      file: 'Holo-3.1-9B.Q6_K.gguf', mmproj: 'Holo-3.1-9B.mmproj-f16.gguf', approxGb: 8.3,
    },
    {
      id: 'holo-3.1-4b', label: 'Holo 3.1 4B (small GPUs)', repo: 'mradermacher/Holo-3.1-4B-GGUF',
      file: 'Holo-3.1-4B.Q6_K.gguf', mmproj: 'Holo-3.1-4B.mmproj-f16.gguf', approxGb: 4.7,
    },
  ]);
  static SUBDIR = 'grounding';
  static HF_BASE = 'https://huggingface.co';

  constructor({ getModelsRoot, createModelDownload }) {
    this._getModelsRoot = getModelsRoot;
    this._createModelDownload = createModelDownload;
    this._active = null;
  }

  static find(id) {
    return GroundingRecommendedModels.RECOMMENDED.find((r) => r.id === id) || null;
  }

  pathsFor(rec) {
    const dir = path.join(this._getModelsRoot(), GroundingRecommendedModels.SUBDIR, rec.repo.replace('/', '__'));
    return { dir, model: path.join(dir, rec.file), mmproj: path.join(dir, rec.mmproj) };
  }

  view() {
    return GroundingRecommendedModels.RECOMMENDED.map((rec) => {
      const paths = this.pathsFor(rec);
      const installed = fs.existsSync(paths.model) && fs.existsSync(paths.mmproj);
      return { ...rec, installed, path: installed ? paths.model : null };
    });
  }

  downloadState() {
    return this._active ? { ...this._active.state } : null;
  }

  async download(id, onEvent, select) {
    const rec = GroundingRecommendedModels.find(id);
    if (!rec) return { success: false, error: `Unknown grounding model: ${id}` };
    if (this._active) return { success: false, error: 'A grounding model download is already running.' };
    this._active = { state: { id, file: null, received: 0, total: 0, done: false }, current: null };
    try {
      return await this._downloadAndSelect(rec, onEvent, select);
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      this._active = null;
    }
  }

  cancel() {
    if (this._active && this._active.current) this._active.current.cancel();
  }

  async _downloadAndSelect(rec, onEvent, select) {
    const paths = this.pathsFor(rec);
    fs.mkdirSync(paths.dir, { recursive: true });
    const completed = await this._fetchMissing([[rec.mmproj, paths.mmproj], [rec.file, paths.model]], rec, onEvent);
    if (!completed) return { success: false, canceled: true };
    this._active.state.done = true;
    const selection = await select({ modelPath: paths.model, mmprojPath: paths.mmproj });
    onEvent({ type: 'done', id: rec.id });
    return selection;
  }

  async _fetchMissing(files, rec, onEvent) {
    for (const [name, destPath] of files) {
      if (fs.existsSync(destPath)) continue;
      const result = await this._fetchOne(rec, name, destPath, onEvent);
      if (!result || !result.success) return false;
    }
    return true;
  }

  _fetchOne(rec, name, destPath, onEvent) {
    const state = this._active.state;
    state.file = name;
    this._active.current = this._createModelDownload({
      url: `${GroundingRecommendedModels.HF_BASE}/${rec.repo}/resolve/main/${name}`,
      destPath,
      onEvent: (type, payload) => {
        if (type === 'download') {
          state.received = payload.received;
          state.total = payload.total;
        }
        onEvent({ type, file: name, ...payload });
      },
    });
    return this._active.current.promise;
  }
}

module.exports = GroundingRecommendedModels;
