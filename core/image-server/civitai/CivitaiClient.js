const axios = require('axios');
const CivitaiAuth = require('../../shared/download/CivitaiAuth');
const DownloadRetry = require('../../shared/download/DownloadRetry');

class CivitaiClient {
  static BASE = 'https://civitai.com/api/v1';

  static DOWNLOAD_BASE = 'https://civitai.com/api/download/models';

  static USER_AGENT = 'LumaBrowser/image-catalog';

  static TIMEOUT_MS = 20000;

  static MAX_LIMIT = 100;

  static MAX_IMAGE_LIMIT = 200;

  static DEFAULT_ATTEMPTS = 3;

  static SORTS = Object.freeze([
    'Highest Rated', 'Most Downloaded', 'Most Liked', 'Most Discussed', 'Most Collected', 'Most Images', 'Newest', 'Oldest',
  ]);

  static IMAGE_SORTS = Object.freeze(['Most Reactions', 'Most Comments', 'Most Collected', 'Newest', 'Oldest', 'Random']);

  static PERIODS = Object.freeze(['AllTime', 'Year', 'Month', 'Week', 'Day']);

  static AUTH = 'CIVITAI_AUTH';

  static NOT_FOUND = 'CIVITAI_NOT_FOUND';

  static BAD_REQUEST = 'CIVITAI_BAD_REQUEST';

  static HTTP = 'CIVITAI_HTTP';

  static NETWORK = 'CIVITAI_NETWORK';

  constructor({ get = axios.get, attempts = CivitaiClient.DEFAULT_ATTEMPTS, timeout = CivitaiClient.TIMEOUT_MS } = {}) {
    this._get = get;
    this._attempts = attempts;
    this._timeout = timeout;
  }

  async listModels(filters = {}, { signal } = {}) {
    const f = filters || {};
    const params = {
      limit: CivitaiClient._limit(f.limit, CivitaiClient.MAX_LIMIT),
      query: f.query,
      page: f.query ? undefined : f.page,
      cursor: f.cursor,
      ids: f.ids,
      tag: f.tag,
      username: f.username,
      types: f.types,
      baseModels: f.baseModels,
      checkpointType: f.checkpointType,
      sort: f.sort,
      period: f.period,
      nsfw: f.nsfw === undefined ? false : !!f.nsfw,
      supportsGeneration: f.supportsGeneration,
      earlyAccess: f.earlyAccess,
      primaryFileOnly: f.primaryFileOnly,
      favorites: f.favorites,
      hidden: f.hidden,
    };
    const data = await this._fetch('/models', params, { signal });
    return CivitaiClient._page(data);
  }

  async getModel(modelId, { signal } = {}) {
    return this._fetch(`/models/${CivitaiClient._id(modelId)}`, {}, { signal });
  }

  async getVersion(versionId, { signal } = {}) {
    return this._fetch(`/model-versions/${CivitaiClient._id(versionId)}`, {}, { signal });
  }

  async getVersionMini(versionId, { signal } = {}) {
    return this._fetch(`/model-versions/mini/${CivitaiClient._id(versionId)}`, {}, { signal });
  }

  async getVersionByHash(hash, { signal } = {}) {
    const clean = String(hash || '').trim();
    if (!/^[0-9a-f]+$/i.test(clean)) throw CivitaiClient._error('A hex hash is required.', CivitaiClient.BAD_REQUEST);
    try {
      return await this._fetch(`/model-versions/by-hash/${clean.toUpperCase()}`, {}, { signal });
    } catch (err) {
      if (err && err.code === CivitaiClient.NOT_FOUND) return null;
      throw err;
    }
  }

  async listImages(filters = {}, { signal } = {}) {
    const f = filters || {};
    const params = {
      limit: CivitaiClient._limit(f.limit, CivitaiClient.MAX_IMAGE_LIMIT),
      modelId: f.modelId,
      modelVersionId: f.modelVersionId,
      postId: f.postId,
      username: f.username,
      sort: f.sort,
      period: f.period,
      nsfw: f.nsfw,
      browsingLevel: f.browsingLevel,
      type: f.type,
      withMeta: f.withMeta === undefined ? true : !!f.withMeta,
      cursor: f.cursor,
    };
    const data = await this._fetch('/images', params, { signal });
    return CivitaiClient._page(data);
  }

  async enums({ signal } = {}) {
    return this._fetch('/enums', {}, { signal });
  }

  static downloadUrl(versionId, { fileId, type, format, size, fp } = {}) {
    return CivitaiClient.buildUrl(`${CivitaiClient.DOWNLOAD_BASE}/${CivitaiClient._id(versionId)}`, { fileId, type, format, size, fp });
  }

  static primaryFile(version) {
    const files = Array.isArray(version && version.files) ? version.files.filter(Boolean) : [];
    return files.find((f) => f.primary) || files.find((f) => f.type === 'Model') || files[0] || null;
  }

  static buildUrl(base, params = {}) {
    const url = new URL(base);
    for (const [key, raw] of Object.entries(params || {})) {
      const values = Array.isArray(raw) ? raw : [raw];
      for (const value of values) {
        if (value === undefined || value === null || value === '') continue;
        url.searchParams.append(key, String(value));
      }
    }
    return url.toString();
  }

  static headers() {
    return { 'User-Agent': CivitaiClient.USER_AGENT, Accept: 'application/json', ...CivitaiAuth.headersFor(CivitaiClient.BASE) };
  }

  async _fetch(apiPath, params, { signal } = {}) {
    const url = CivitaiClient.buildUrl(`${CivitaiClient.BASE}${apiPath}`, params);
    try {
      const res = await DownloadRetry.run(
        () => this._get(url, { headers: CivitaiClient.headers(), signal, timeout: this._timeout }),
        { attempts: this._attempts, isStopped: () => !!(signal && signal.aborted), maxDelayMs: 10000 },
      );
      return res.data;
    } catch (err) {
      throw CivitaiClient._translate(err, url);
    }
  }

  static _page(data) {
    const items = Array.isArray(data && data.items) ? data.items : [];
    const meta = (data && data.metadata) || {};
    return {
      items,
      nextCursor: meta.nextCursor || null,
      nextPage: meta.nextPage || null,
      ...(meta.currentPage !== undefined ? { currentPage: meta.currentPage, pageSize: meta.pageSize } : {}),
    };
  }

  static _limit(value, max) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) return undefined;
    return Math.min(Math.floor(n), max);
  }

  static _id(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) throw CivitaiClient._error('A positive integer id is required.', CivitaiClient.BAD_REQUEST);
    return n;
  }

  static _translate(err, url) {
    if (err && err.code && String(err.code).startsWith('CIVITAI_')) return err;
    if (err && (err.name === 'AbortError' || err.code === 'ERR_CANCELED')) return err;
    const res = err && err.response;
    const status = res && Number.isFinite(res.status) ? res.status : null;
    if (status === null) {
      return CivitaiClient._error(`CivitAI request failed: ${(err && err.message) || String(err)}`, CivitaiClient.NETWORK, { url });
    }
    const serverText = CivitaiClient._serverError(res.data);
    if (status === 401 || status === 403) {
      const why = CivitaiAuth.hasToken()
        ? 'your CivitAI API key was refused: check it in settings.'
        : 'this needs a CivitAI API key: add one in settings.';
      return CivitaiClient._error(`CivitAI refused the request (HTTP ${status}): ${why}`, CivitaiClient.AUTH, { url, status });
    }
    if (status === 404) {
      return CivitaiClient._error(`Not found on CivitAI${serverText ? `: ${serverText}` : '.'}`, CivitaiClient.NOT_FOUND, { url, status });
    }
    if (status === 400) {
      return CivitaiClient._error(`CivitAI rejected the request${serverText ? `: ${serverText}` : '.'}`, CivitaiClient.BAD_REQUEST, { url, status });
    }
    return CivitaiClient._error(`CivitAI request failed: HTTP ${status}`, CivitaiClient.HTTP, { url, status });
  }

  static _serverError(data) {
    if (!data || typeof data !== 'object') return '';
    if (typeof data.error === 'string') return data.error;
    if (data.error && typeof data.error.message === 'string') return 'invalid parameters';
    return '';
  }

  static _error(message, code, extra = {}) {
    return Object.assign(new Error(message), { code, ...extra });
  }
}

module.exports = CivitaiClient;
