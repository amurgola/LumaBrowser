const axios = require('axios');

class HfHubClient {
  static BASE = 'https://huggingface.co';

  static USER_AGENT = 'LumaBrowser/llm-catalog';

  static TIMEOUT_MS = 15000;

  static NO_ACCESS_STATUSES = [401, 403, 404];

  static async get(url, { signal, timeout = HfHubClient.TIMEOUT_MS } = {}) {
    const res = await axios.get(url, {
      headers: HfHubClient._authHeaders(),
      signal,
      timeout,
      validateStatus: HfHubClient._isOkOrNoAccess,
    });
    HfHubClient._throwIfNoAccess(res.status);
    return res.data;
  }

  static async getRepoFile(repoId, file, { signal, accept, ...axiosOptions } = {}) {
    try {
      const res = await axios.get(HfHubClient.fileUrl(repoId, file), {
        headers: { ...HfHubClient._authHeaders(), Accept: accept },
        signal,
        timeout: HfHubClient.TIMEOUT_MS,
        validateStatus: HfHubClient._isOkOrNoAccess,
        ...axiosOptions,
      });
      if (res.status !== 200) return null;
      return res.data == null ? '' : res.data;
    } catch (_) {
      return null;
    }
  }

  static fileUrl(repoId, file) {
    return `${HfHubClient.BASE}/${repoId}/resolve/main/${file}`;
  }

  static resolveUrl(repoId, repoPath) {
    return `${HfHubClient.fileUrl(repoId, encodeURI(repoPath))}?download=true`;
  }

  static treeUrl(repoId) {
    return `${HfHubClient.BASE}/api/models/${repoId}/tree/main?recursive=true`;
  }

  static normalizeRepoId(raw) {
    return String(raw || '').trim().replace(/^\/+|\/+$/g, '');
  }

  static isRepoId(id) {
    return /^[^/\s]+\/[^/\s]+$/.test(id);
  }

  static requireRepoId(raw) {
    const id = HfHubClient.normalizeRepoId(raw);
    if (!HfHubClient.isRepoId(id)) {
      throw Object.assign(new Error('Expected an "owner/repo" id.'), { code: 'HF_BAD_ID' });
    }
    return id;
  }

  static splitRepoId(id) {
    const [author, ...rest] = id.split('/');
    return { author: author || '', name: rest.join('/') };
  }

  static notFound(message) {
    return Object.assign(new Error(message), { code: 'HF_NOT_FOUND' });
  }

  static _authHeaders() {
    const headers = { 'User-Agent': HfHubClient.USER_AGENT, Accept: 'application/json' };
    const token = process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  static _isOkOrNoAccess(status) {
    return (status >= 200 && status < 300) || HfHubClient.NO_ACCESS_STATUSES.includes(status);
  }

  static _throwIfNoAccess(status) {
    if (status === 404) throw HfHubClient.notFound('Not found on HuggingFace.');
    if (status === 401 || status === 403) {
      throw HfHubClient.notFound('This model is private or gated. Set HF_TOKEN, or pick another.');
    }
  }
}

module.exports = HfHubClient;
