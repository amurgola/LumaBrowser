const HfHubClient = require('./HfHubClient');
const GgufFileName = require('./GgufFileName');
const GgufVariantGrouper = require('./GgufVariantGrouper');

class HfGgufRepo {
  static async fetchVariants(repoId, { signal } = {}) {
    const id = HfHubClient.requireRepoId(repoId);
    const [meta, tree] = await HfGgufRepo._fetchMetaAndTree(id, signal);
    return HfGgufRepo._describe(id, meta, tree);
  }

  static async fetchCompanions(repoId, { signal } = {}) {
    const id = HfHubClient.normalizeRepoId(repoId);
    if (!HfHubClient.isRepoId(id)) return HfGgufRepo._noCompanions();
    const tree = await HfGgufRepo._fetchTreeOrNull(id, signal);
    if (tree === null) return HfGgufRepo._noCompanions();
    return HfGgufRepo._collectCompanions(id, tree);
  }

  static async fetchMmprojs(repoId, { signal } = {}) {
    return (await HfGgufRepo.fetchCompanions(repoId, { signal })).mmprojs;
  }

  static async _fetchMetaAndTree(id, signal) {
    const [meta, tree] = await Promise.all([
      HfHubClient.get(`${HfHubClient.BASE}/api/models/${id}?expand[]=gguf&expand[]=gated`, { signal })
        .catch((err) => (err.code === 'HF_NOT_FOUND' ? null : Promise.reject(err))),
      HfHubClient.get(HfHubClient.treeUrl(id), { signal }),
    ]);
    if (meta === null) throw HfHubClient.notFound(`No such model: ${id}`);
    return [meta, tree];
  }

  static _describe(id, meta, tree) {
    const gguf = (meta && meta.gguf) || {};
    const { author, name } = HfHubClient.splitRepoId(id);
    return {
      repoId: id,
      author,
      name,
      gated: !!(meta && meta.gated),
      paramsB: gguf.total ? gguf.total / 1e9 : null,
      maxContext: Number(gguf.context_length) || null,
      architecture: gguf.architecture || null,
      chatTemplate: gguf.chat_template || null,
      variants: GgufVariantGrouper.group(tree).map((variant) => HfGgufRepo._toDownloadVariant(id, variant)),
    };
  }

  static _toDownloadVariant(id, variant) {
    return {
      quant: variant.quant,
      file: variant.file,
      url: HfHubClient.resolveUrl(id, variant.path),
      approxBytes: variant.approxBytes,
      sharded: variant.sharded,
      partUrls: variant.sharded ? variant.partPaths.map((path) => HfHubClient.resolveUrl(id, path)) : undefined,
    };
  }

  static async _fetchTreeOrNull(id, signal) {
    try {
      return await HfHubClient.get(HfHubClient.treeUrl(id), { signal });
    } catch (_) {
      return null;
    }
  }

  static _collectCompanions(id, tree) {
    const companions = HfGgufRepo._noCompanions();
    for (const entry of Array.isArray(tree) ? tree : []) {
      HfGgufRepo._addCompanion(companions, id, entry);
    }
    return companions;
  }

  static _addCompanion(companions, id, entry) {
    if (!entry || entry.type === 'directory') return;
    const path = entry.path || '';
    if (!GgufFileName.isGguf(path)) return;
    const base = GgufFileName.basename(path);
    const common = { file: base, path, url: HfHubClient.resolveUrl(id, path), approxBytes: Number(entry.size) || 0 };
    if (GgufFileName.isMmproj(base)) {
      companions.mmprojs.push({ ...common, precision: GgufFileName.projectorPrecision(base) });
    } else if (GgufFileName.isMtpHead(path)) {
      companions.mtps.push({ ...common, quant: GgufFileName.quantOf(base) });
    }
  }

  static _noCompanions() {
    return { mmprojs: [], mtps: [] };
  }
}

module.exports = HfGgufRepo;
