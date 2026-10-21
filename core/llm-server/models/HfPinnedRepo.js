const HfHubClient = require('./HfHubClient');
const SafeRepoPath = require('../../shared/download/SafeRepoPath');

class HfPinnedRepo {
  static SHA256 = /^[0-9a-f]{64}$/i;

  static async pin(repoId, { revision = HfHubClient.DEFAULT_REVISION, signal } = {}) {
    const id = HfHubClient.requireRepoId(repoId);
    const resolved = await HfHubClient.resolveRevision(id, revision, { signal });
    const tree = await HfHubClient.get(HfHubClient.treeUrl(id, resolved.sha), { signal, attempts: 3 });
    return HfPinnedRepo.fromTree(id, resolved, tree);
  }

  static fromTree(repoId, revision, tree) {
    const files = (Array.isArray(tree) ? tree : [])
      .filter((entry) => entry && entry.type !== 'directory' && entry.path && SafeRepoPath.isSafe(entry.path))
      .map((entry) => HfPinnedRepo._file(entry));
    return new HfPinnedRepo(repoId, revision, files);
  }

  constructor(repoId, revision, files) {
    this.repoId = repoId;
    this.revision = {
      requested: revision.requested,
      sha: revision.sha,
      pinned: !!revision.pinned,
      fallbackReason: revision.fallbackReason || null,
    };
    this.files = files;
    this._byPath = new Map(files.map((file) => [file.path, file]));
  }

  get sha() {
    return this.revision.sha;
  }

  get pinned() {
    return this.revision.pinned;
  }

  get totalBytes() {
    return this.files.reduce((sum, file) => sum + file.size, 0);
  }

  urlFor(repoPath) {
    return HfHubClient.resolveUrl(this.repoId, repoPath, this.sha);
  }

  fileFor(repoPath) {
    const file = this._byPath.get(String(repoPath || ''));
    return file ? { ...file, url: this.urlFor(file.path) } : null;
  }

  describe() {
    return { ...this.revision };
  }

  static _file(entry) {
    const lfs = entry.lfs && typeof entry.lfs === 'object' ? entry.lfs : null;
    const oid = lfs && typeof lfs.oid === 'string' && HfPinnedRepo.SHA256.test(lfs.oid) ? lfs.oid.toLowerCase() : null;
    const size = Number(lfs && lfs.size) || Number(entry.size) || 0;
    return { path: entry.path, size, sha256: oid };
  }
}

module.exports = HfPinnedRepo;
