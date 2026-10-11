const axios = require('axios');
const PinnedTls = require('../../../network-sharing/tls/PinnedTls');

// Backend allocation, not the model's training limit or max_tokens (reply cap).
class BackendContextProbe {
  static PROBE_TIMEOUT_MS = 2000;
  static LOAD_TIMEOUT_MS = 120000;

  constructor({ request = axios.request } = {}) {
    this._request = request;
  }

  async detect(config, modelId, { signal, onStatus } = {}) {
    if (config.type !== 'openai') return null;
    const base = BackendContextProbe.baseUrl(config.endpoint);
    if (!base) return null;
    const request = async (path, data) => {
      signal?.throwIfAborted();
      try {
        const response = await this._request({
          url: base + path, method: data ? 'POST' : 'GET', data, signal,
          headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
          timeout: data ? BackendContextProbe.LOAD_TIMEOUT_MS : BackendContextProbe.PROBE_TIMEOUT_MS,
          maxRedirects: 0, maxContentLength: 2 * 1024 * 1024,
          httpsAgent: PinnedTls.agentFor(base) || undefined,
        });
        signal?.throwIfAborted();
        return response.data;
      } catch (error) {
        signal?.throwIfAborted();
        // Optional discovery must not break providers without native APIs.
        return null;
      }
    };
    const [ps, lm, models, props] = await Promise.all([
      config.peerManaged ? null : request('/api/ps'),
      config.peerManaged ? null : request('/api/v1/models'), request('/v1/models'),
      config.peerManaged ? null : request(`/props?model=${encodeURIComponent(modelId)}&autoload=false`),
    ]);
    const ollama = BackendContextProbe.ollama(ps, modelId);
    if (ollama) return ollama;
    // Only an identified Ollama server may receive a load request. Selecting a
    // model never calls detect(); this runs when the user actually sends a turn.
    if (Array.isArray(ps?.models) && !BackendContextProbe.ollamaEntry(ps, modelId)) {
      const version = await request('/api/version');
      if (typeof version?.version === 'string' && version.version) {
        onStatus?.({ phase: 'loading-context' });
        const loaded = await request('/api/generate', { model: modelId, stream: false });
        if (loaded?.done === true) return BackendContextProbe.ollama(await request('/api/ps'), modelId);
        return null;
      }
    }
    const studio = BackendContextProbe.lmStudio(lm, modelId);
    if (studio) return studio;
    const entries = Array.isArray(models?.data) ? models.data : [];
    const entry = entries.find((m) => m?.id === modelId);
    const advertised = BackendContextProbe.tokens(entry?.luma_context);
    if (advertised) return { tokens: advertised, source: 'provider' };
    // A generic gateway may ignore ?model. Never apply global /props to one
    // member of a multi-model catalogue, or guess from a filename/basename.
    if (entries.length === 1 && entry) {
      const tokens = BackendContextProbe.tokens(props?.default_generation_settings?.n_ctx);
      if (tokens) return { tokens, source: 'llama.cpp' };
    }
    return null;
  }

  static tokens(value) {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  static baseUrl(endpoint) {
    try {
      const url = new URL(endpoint);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
      url.pathname = url.pathname.replace(/\/+$/, '');
      return url.toString().replace(/\/$/, '');
    } catch (_) { return null; }
  }

  static ollamaEntry(body, id) {
    // Ollama supplies :latest for an omitted tag. Preserve namespaces and tags.
    const canonical = (name) => typeof name === 'string'
      ? (name.slice(name.lastIndexOf('/') + 1).includes(':') ? name : `${name}:latest`) : null;
    return Array.isArray(body?.models)
      ? body.models.find((m) => m && [m.name, m.model].some((name) => canonical(name) === canonical(id))) : null;
  }

  static ollama(body, id) {
    const tokens = BackendContextProbe.tokens(BackendContextProbe.ollamaEntry(body, id)?.context_length);
    return tokens ? { tokens, source: 'ollama' } : null;
  }

  static lmStudio(body, id) {
    const models = Array.isArray(body?.models) ? body.models.filter((m) => m?.type === 'llm') : [];
    const instances = models.flatMap((m) => Array.isArray(m.loaded_instances) ? m.loaded_instances : []);
    const exact = instances.filter((i) => i?.id === id);
    const model = models.find((m) => m.key === id);
    const candidates = exact.length ? exact : model?.loaded_instances;
    if (!Array.isArray(candidates) || !candidates.length) return null;
    const windows = candidates.map((i) => BackendContextProbe.tokens(i?.config?.context_length));
    // If a key can route to several instances, budget for the smallest. Do not
    // divide by parallel: config.context_length is already per prediction.
    return windows.every(Boolean) ? { tokens: Math.min(...windows), source: 'lm-studio' } : null;
  }
}

module.exports = BackendContextProbe;
