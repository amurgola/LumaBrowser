const HfHubClient = require('./HfHubClient');
const ModelCardSampler = require('./ModelCardSampler');

class ModelCardSettings {
  static MAX_REPOS = 4;

  static async find(repoId, { client = HfHubClient, signal = null, maxRepos = ModelCardSettings.MAX_REPOS } = {}) {
    const queue = [String(repoId || '').trim()].filter(Boolean);
    const seen = new Set();
    while (queue.length && seen.size < maxRepos) {
      const id = queue.shift();
      if (seen.has(id) || !HfHubClient.isRepoId(id)) continue;
      seen.add(id);
      const card = await ModelCardSettings._text(client, id, 'README.md', signal);
      const fromCard = card ? ModelCardSampler.fromCard(card) : {};
      if (Object.keys(fromCard).length) return ModelCardSettings._found(fromCard, 'card', id);
      const config = await ModelCardSettings._text(client, id, 'generation_config.json', signal);
      const fromConfig = config ? ModelCardSampler.fromGenerationConfig(config) : {};
      if (Object.keys(fromConfig).length) return ModelCardSettings._found(fromConfig, 'generation_config', id);
      if (card && ModelCardSampler.isRepackaging(card, id)) {
        for (const base of ModelCardSampler.baseModels(card)) if (!seen.has(base)) queue.push(base);
      }
    }
    return null;
  }

  static _found(settings, kind, repoId) {
    const text = (kind === 'card' ? 'the model card of ' : 'generation_config.json of ') + repoId;
    return { settings, source: { kind, repoId }, text };
  }

  static async _text(client, repoId, file, signal) {
    try {
      const data = await client.getRepoFile(repoId, file, { signal, responseType: 'text' });
      if (data === null || data === undefined || data === '') return null;
      return typeof data === 'string' ? data : data;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ModelCardSettings;
