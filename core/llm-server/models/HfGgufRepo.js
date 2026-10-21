const HfHubClient = require('./HfHubClient');
const HfPinnedRepo = require('./HfPinnedRepo');
const GgufFileName = require('./GgufFileName');
const GgufVariantGrouper = require('./GgufVariantGrouper');

class HfGgufRepo {
  static async fetchVariants(repoId, { signal, revision } = {}) {
    const id = HfHubClient.requireRepoId(repoId);
    const [meta, pinned] = await HfGgufRepo._fetchMetaAndPin(id, signal, revision);
    return HfGgufRepo._describe(id, meta, pinned);
  }

  static async fetchCompanions(repoId, { signal, revision } = {}) {
    const id = HfHubClient.normalizeRepoId(repoId);
    if (!HfHubClient.isRepoId(id)) return HfGgufRepo._noCompanions();
    const pinned = await HfGgufRepo._pinOrNull(id, signal, revision);
    if (pinned === null) return HfGgufRepo._noCompanions();
    return HfGgufRepo._collectCompanions(pinned);
  }

  static async fetchMmprojs(repoId, { signal } = {}) {
    return (await HfGgufRepo.fetchCompanions(repoId, { signal })).mmprojs;
  }

  static async _fetchMetaAndPin(id, signal, revision) {
    const [meta, pinned] = await Promise.all([
      HfHubClient.get(`${HfHubClient.BASE}/api/models/${id}?expand[]=gguf&expand[]=gated`, { signal })
        .catch((err) => (err.code === 'HF_NOT_FOUND' ? null : Promise.reject(err))),
      HfPinnedRepo.pin(id, { signal, revision }),
    ]);
    if (meta === null) throw HfHubClient.notFound(`No such model: ${id}`);
    return [meta, pinned];
  }

  static _describe(id, meta, pinned) {
    const gguf = (meta && meta.gguf) || {};
    const { author, name } = HfHubClient.splitRepoId(id);
    const tree = pinned.files.map((file) => ({ type: 'file', path: file.path, size: file.size }));
    return {
      repoId: id,
      author,
      name,
      gated: !!(meta && meta.gated),
      paramsB: gguf.total ? gguf.total / 1e9 : null,
      maxContext: Number(gguf.context_length) || null,
      architecture: gguf.architecture || null,
      chatTemplate: gguf.chat_template || null,
      revision: pinned.describe(),
      variants: GgufVariantGrouper.group(tree).map((variant) => HfGgufRepo._toDownloadVariant(pinned, variant)),
    };
  }

  static _toDownloadVariant(pinned, variant) {
    const parts = variant.partPaths.map((repoPath) => HfGgufRepo._partOf(pinned, repoPath));
    return {
      quant: variant.quant,
      file: variant.file,
      url: pinned.urlFor(variant.path),
      approxBytes: variant.approxBytes,
      sha256: variant.sharded ? null : parts[0].sha256,
      sharded: variant.sharded,
      partUrls: variant.sharded ? parts.map((part) => part.url) : undefined,
      parts: variant.sharded ? parts : undefined,
    };
  }

  static _partOf(pinned, repoPath) {
    const file = pinned.fileFor(repoPath) || { path: repoPath, size: 0, sha256: null, url: pinned.urlFor(repoPath) };
    return { url: file.url, file: GgufFileName.basename(repoPath), size: file.size, sha256: file.sha256 };
  }

  static async _pinOrNull(id, signal, revision) {
    try {
      if (revision && /^[0-9a-f]{40}$/i.test(revision)) {
        const tree = await HfHubClient.get(HfHubClient.treeUrl(id, revision), { signal });
        return HfPinnedRepo.fromTree(id, { requested: revision, sha: revision.toLowerCase(), pinned: true }, tree);
      }
      return await HfPinnedRepo.pin(id, { signal, revision });
    } catch (_) {
      return null;
    }
  }

  static _collectCompanions(pinned) {
    const companions = HfGgufRepo._noCompanions();
    for (const file of pinned.files) HfGgufRepo._addCompanion(companions, pinned, file);
    return companions;
  }

  static _addCompanion(companions, pinned, file) {
    const repoPath = file.path || '';
    if (!GgufFileName.isGguf(repoPath)) return;
    const base = GgufFileName.basename(repoPath);
    const common = { file: base, path: repoPath, url: pinned.urlFor(repoPath), approxBytes: file.size, sha256: file.sha256 };
    if (GgufFileName.isMmproj(base)) {
      companions.mmprojs.push({ ...common, precision: GgufFileName.projectorPrecision(base) });
    } else if (GgufFileName.isMtpHead(repoPath)) {
      companions.mtps.push({ ...common, quant: GgufFileName.quantOf(base) });
    }
  }

  static _noCompanions() {
    return { mmprojs: [], mtps: [] };
  }
}

module.exports = HfGgufRepo;
