const axios = require('axios');
const HubAuth = require('../../shared/download/HubAuth');
const DownloadError = require('../../shared/download/DownloadError');
const DownloadRetry = require('../../shared/download/DownloadRetry');

class HfHubClient {
  static BASE = 'https://huggingface.co';

  static USER_AGENT = 'LumaBrowser/llm-catalog';

  static TIMEOUT_MS = 15000;

  static DEFAULT_REVISION = 'main';

  static NO_ACCESS_STATUSES = [401, 403, 404];

  static async get(url, { signal, timeout = HfHubClient.TIMEOUT_MS, attempts = 1 } = {}) {
    return DownloadRetry.run(() => HfHubClient._getOnce(url, { signal, timeout }), {
      attempts, isStopped: () => !!(signal && signal.aborted), maxDelayMs: 5000,
    });
  }

  static async getRepoFile(repoId, file, { signal, accept, revision, ...axiosOptions } = {}) {
    try {
      const res = await axios.get(HfHubClient.fileUrl(repoId, file, revision), {
        headers: { ...HfHubClient.authHeaders(), Accept: accept },
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

  static async resolveRevision(repoId, revision = HfHubClient.DEFAULT_REVISION, { signal } = {}) {
    const requested = String(revision || HfHubClient.DEFAULT_REVISION);
    try {
      const data = await HfHubClient.get(HfHubClient.revisionUrl(repoId, requested), { signal, attempts: 3 });
      const sha = data && typeof data.sha === 'string' && /^[0-9a-f]{40}$/i.test(data.sha) ? data.sha.toLowerCase() : null;
      if (sha) return { requested, sha, pinned: true };
      return { requested, sha: requested, pinned: false, fallbackReason: 'the Hub answered without a commit sha' };
    } catch (err) {
      if (HfHubClient.isAccessError(err)) throw err;
      return { requested, sha: requested, pinned: false, fallbackReason: (err && err.message) || String(err) };
    }
  }

  static fileUrl(repoId, file, revision = HfHubClient.DEFAULT_REVISION) {
    return `${HfHubClient.BASE}/${repoId}/resolve/${HfHubClient._revisionSegment(revision)}/${file}`;
  }

  static resolveUrl(repoId, repoPath, revision = HfHubClient.DEFAULT_REVISION) {
    return `${HfHubClient.fileUrl(repoId, encodeURI(repoPath), revision)}?download=true`;
  }

  static treeUrl(repoId, revision = HfHubClient.DEFAULT_REVISION) {
    return `${HfHubClient.BASE}/api/models/${repoId}/tree/${HfHubClient._revisionSegment(revision)}?recursive=true`;
  }

  static revisionUrl(repoId, revision = HfHubClient.DEFAULT_REVISION) {
    return `${HfHubClient.BASE}/api/models/${repoId}/revision/${HfHubClient._revisionSegment(revision)}`;
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

  static isAccessError(err) {
    return DownloadError.is(err, DownloadError.ACCESS_DENIED);
  }

  static authHeaders() {
    const headers = { 'User-Agent': HfHubClient.USER_AGENT, Accept: 'application/json' };
    const token = HubAuth.token();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  static async _getOnce(url, { signal, timeout }) {
    const res = await axios.get(url, {
      headers: HfHubClient.authHeaders(),
      signal,
      timeout,
      validateStatus: HfHubClient._isOkOrNoAccess,
    });
    HfHubClient._throwIfNoAccess(res.status, url);
    return res.data;
  }

  static _revisionSegment(revision) {
    return encodeURIComponent(String(revision || HfHubClient.DEFAULT_REVISION));
  }

  static _isOkOrNoAccess(status) {
    return (status >= 200 && status < 300) || HfHubClient.NO_ACCESS_STATUSES.includes(status);
  }

  static _throwIfNoAccess(status, url) {
    if (status === 404) throw HfHubClient.notFound('Not found on HuggingFace.');
    if (status === 401 || status === 403) throw DownloadError.fromStatus(status, { url: url || HfHubClient.BASE });
  }
}

module.exports = HfHubClient;
