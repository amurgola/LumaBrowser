const HfHubClient = require('./HfHubClient');
const HfPinnedRepo = require('./HfPinnedRepo');

class HfPackRepo {
  static async fetchInfo(repoId, { extension, signal, revision } = {}) {
    const id = HfHubClient.requireRepoId(repoId);
    const [meta, pinned] = await Promise.all([HfPackRepo._fetchMeta(id, signal), HfPinnedRepo.pin(id, { signal, revision })]);
    const { author, name } = HfHubClient.splitRepoId(id);
    return { repoId: id, author, name, gated: !!(meta && meta.gated), variants: HfPackRepo.variants(pinned, extension) };
  }

  static variants(pinned, extension) {
    const wanted = String(extension || '').toLowerCase();
    return pinned.files
      .filter((file) => wanted && file.path.toLowerCase().endsWith(wanted))
      .map((file) => HfPackRepo._variant(pinned, file, wanted))
      .sort((a, b) => a.approxBytes - b.approxBytes);
  }

  static async _fetchMeta(id, signal) {
    try {
      return await HfHubClient.get(`${HfHubClient.BASE}/api/models/${id}?expand[]=gated`, { signal });
    } catch (err) {
      if (err.code === 'HF_NOT_FOUND') throw HfHubClient.notFound(`No such model: ${id}`);
      throw err;
    }
  }

  static _variant(pinned, file, extension) {
    const base = file.path.split('/').pop();
    return {
      quant: base.slice(0, base.length - extension.length),
      file: base,
      url: pinned.urlFor(file.path),
      approxBytes: file.size,
      sha256: file.sha256,
      sharded: false,
    };
  }
}

module.exports = HfPackRepo;
