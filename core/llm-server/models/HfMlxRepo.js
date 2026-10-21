const HfHubClient = require('./HfHubClient');
const HfPinnedRepo = require('./HfPinnedRepo');

class HfMlxRepo {
  static async fetchInfo(repoId, { signal, revision } = {}) {
    const id = HfHubClient.requireRepoId(repoId);
    const [meta, pinned, config] = await HfMlxRepo._fetchAll(id, signal, revision);
    const files = pinned.files.map((file) => ({ path: file.path, size: file.size, sha256: file.sha256 }));
    return {
      ...HfMlxRepo._identity(id, meta),
      ...HfMlxRepo._modelFacts(id, meta, config || {}),
      ...HfMlxRepo._sizes(files),
      revision: pinned.describe(),
      files,
    };
  }

  static quantFromName(repoId) {
    const id = String(repoId || '');
    const bits = /(?:^|[-_/])(\d{1,2})bit\b/i.exec(id);
    if (bits) return `${bits[1]}-bit`;
    const dtype = /(?:^|[-_/])(bf16|fp16|f16|fp32|f32)\b/i.exec(id);
    return dtype ? dtype[1].toUpperCase() : null;
  }

  static async _fetchAll(id, signal, revision) {
    const [meta, pinned, config] = await Promise.all([
      HfHubClient.get(`${HfHubClient.BASE}/api/models/${id}?expand[]=safetensors&expand[]=gated`, { signal })
        .catch((err) => (err.code === 'HF_NOT_FOUND' ? null : Promise.reject(err))),
      HfPinnedRepo.pin(id, { signal, revision }),
      HfMlxRepo._fetchConfig(id, signal),
    ]);
    if (meta === null) throw HfHubClient.notFound(`No such model: ${id}`);
    return [meta, pinned, config];
  }

  static async _fetchConfig(id, signal) {
    const data = await HfHubClient.getRepoFile(id, 'config.json', {
      signal,
      accept: 'application/json, text/plain, */*',
      responseType: 'json',
    });
    return data && typeof data === 'object' ? data : null;
  }

  static _identity(id, meta) {
    const { author, name } = HfHubClient.splitRepoId(id);
    return { repoId: id, author, name, gated: !!(meta && meta.gated) };
  }

  static _modelFacts(id, meta, config) {
    const safetensors = (meta && meta.safetensors) || {};
    return {
      paramsB: Number(safetensors.total) > 0 ? Number(safetensors.total) / 1e9 : null,
      maxContext: Number(config.max_position_embeddings) > 0 ? Number(config.max_position_embeddings) : null,
      architecture: HfMlxRepo._architecture(config),
      quantization: HfMlxRepo._quantization(id, config),
    };
  }

  static _architecture(config) {
    if (Array.isArray(config.architectures) && config.architectures[0]) return String(config.architectures[0]);
    return config.model_type ? String(config.model_type) : null;
  }

  static _quantization(id, config) {
    const quant = config.quantization || config.quantization_config || null;
    if (quant && typeof quant === 'object' && quant.bits) return `${quant.bits}-bit`;
    return HfMlxRepo.quantFromName(id);
  }

  static _sizes(files) {
    const totalBytes = HfMlxRepo._sum(files);
    const weightsBytes = HfMlxRepo._sum(files.filter((file) => /\.safetensors$/i.test(file.path))) || totalBytes;
    return { totalBytes, weightsBytes };
  }

  static _sum(files) {
    return files.reduce((total, file) => total + file.size, 0);
  }
}

module.exports = HfMlxRepo;
