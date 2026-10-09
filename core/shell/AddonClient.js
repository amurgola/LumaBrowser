const crypto = require('crypto');
const SignedLumaClient = require('../shared/lumabyte/SignedLumaClient');

class AddonClient {
  static DEFAULT_BASE_URL = 'https://lumabyte.com';
  static LIST_TIMEOUT_MS = 6000;
  static DOWNLOAD_TIMEOUT_MS = 60000;

  constructor({ identity, baseUrl = AddonClient.DEFAULT_BASE_URL } = {}) {
    this._baseUrl = baseUrl.replace(/\/$/, '');
    this._client = new SignedLumaClient({
      baseUrl: this._baseUrl,
      identity,
      label: 'AddonClient',
      allowEgress: () => true,
    });
  }

  async listAddons() {
    const res = await this._get(`${this._baseUrl}/api/addons`, AddonClient.LIST_TIMEOUT_MS);
    const failure = AddonClient._listFailure(res);
    if (failure) return { ok: false, error: failure, extensions: [] };
    return AddonClient._parseCatalog(res.body);
  }

  async downloadAddon(id) {
    if (!id) return { ok: false, error: 'missing add-on id' };
    const url = `${this._baseUrl}/api/addons/${encodeURIComponent(id)}/download`;
    const res = await this._get(url, AddonClient.DOWNLOAD_TIMEOUT_MS);
    const failure = AddonClient._downloadFailure(res);
    if (failure) return { ok: false, error: failure };
    return AddonClient._verifiedDownload(res);
  }

  _get(url, timeoutMs) {
    return this._client.request({ method: 'GET', url, timeoutMs });
  }

  static _listFailure(res) {
    if (!res) return 'Could not reach the add-on server';
    if (res.statusCode === 401) return 'This install is not authorized';
    if (!AddonClient._isSuccess(res.statusCode)) return `Server error (${res.statusCode})`;
    return null;
  }

  static _parseCatalog(body) {
    try {
      const parsed = JSON.parse(body.toString('utf8'));
      return { ok: true, extensions: Array.isArray(parsed.extensions) ? parsed.extensions : [] };
    } catch {
      return { ok: false, error: 'Malformed catalog response', extensions: [] };
    }
  }

  static _downloadFailure(res) {
    if (!res) return 'Download failed (network)';
    if (res.statusCode === 404) return 'Add-on not found';
    if (!AddonClient._isSuccess(res.statusCode)) return `Download failed (${res.statusCode})`;
    if (!res.body || res.body.length === 0) return 'Empty download';
    return null;
  }

  static _verifiedDownload(res) {
    const expected = SignedLumaClient.headerValue(res.headers['x-addon-sha256']).toLowerCase();
    if (expected && AddonClient._sha256(res.body) !== expected) {
      return { ok: false, error: 'Integrity check failed (sha256 mismatch)' };
    }
    return { ok: true, data: res.body, sha256: expected || null };
  }

  static _sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static _isSuccess(statusCode) {
    return statusCode >= 200 && statusCode < 300;
  }
}

module.exports = AddonClient;
