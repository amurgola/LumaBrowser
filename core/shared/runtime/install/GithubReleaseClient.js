const axios = require('axios');
const RuntimeInstallError = require('./RuntimeInstallError');

class GithubReleaseClient {
  static API_TIMEOUT_MS = 15000;
  static LIST_PAGE_SIZE = 10;
  static SCAN_PAGE_SIZE = 30;

  constructor({ userAgent, http = axios } = {}) {
    this._userAgent = userAgent;
    this._http = http;
  }

  async latestRelease({ owner, repo }) {
    const res = await this._api(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
    if (GithubReleaseClient._isRelease(res)) {
      return (await this._followNightlyPointer(res.data, { owner, repo })) || res.data;
    }
    if (res.status === 404 || res.status === 200) return this._newestStableFromList({ owner, repo });
    throw new RuntimeInstallError(
      `GitHub API returned ${res.status} for ${owner}/${repo} latest release.`,
      'GITHUB_API_NON_200',
      { status: res.status, body: res.data },
    );
  }

  async latestPrerelease({ owner, repo }) {
    const res = await this._api(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=${GithubReleaseClient.LIST_PAGE_SIZE}`);
    if (res.status !== 200 || !Array.isArray(res.data)) {
      throw new RuntimeInstallError(`GitHub API returned ${res.status} listing ${owner}/${repo} releases.`, 'GITHUB_API_NON_200');
    }
    const newest = res.data.find((r) => r && !r.draft);
    if (!newest) throw new RuntimeInstallError(`${owner}/${repo} has no published GitHub releases.`, 'NO_RELEASES');
    return newest;
  }

  async newestReleaseWithAsset({ owner, repo }, assetRegex, skipTag = null) {
    const list = await this._scanList({ owner, repo });
    for (const release of list) {
      if (!release || release.draft || release.tag_name === skipTag) continue;
      const asset = (release.assets || []).find((a) => assetRegex.test(a.name));
      if (asset) return { release, asset };
    }
    return null;
  }

  async _scanList({ owner, repo }) {
    try {
      const res = await this._api(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=${GithubReleaseClient.SCAN_PAGE_SIZE}`);
      return res.status === 200 && Array.isArray(res.data) ? res.data : [];
    } catch (_) {
      return [];
    }
  }

  async _newestStableFromList({ owner, repo }) {
    const res = await this._api(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=${GithubReleaseClient.LIST_PAGE_SIZE}`);
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.find((r) => !r.draft && !r.prerelease) || res.data[0];
    }
    throw new RuntimeInstallError(`${owner}/${repo} has no published GitHub releases.`, 'NO_RELEASES', {
      repoUrl: `https://github.com/${owner}/${repo}`,
      note: 'The upstream project ships source-only. Build it locally or wait for a binary release.',
    });
  }

  async _followNightlyPointer(release, { owner, repo }) {
    const pointer = (release.assets || []).find((a) => /^nightly-tag\.txt$/i.test(a.name));
    if (!pointer || !pointer.browser_download_url) return null;
    try {
      const tag = await this._readPointerTag(pointer.browser_download_url);
      if (!tag) return null;
      const res = await this._api(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`);
      return GithubReleaseClient._isRelease(res) ? res.data : null;
    } catch (_) {
      return null;
    }
  }

  async _readPointerTag(url) {
    const txt = await this._http.get(url, {
      headers: { 'User-Agent': this._userAgent },
      timeout: GithubReleaseClient.API_TIMEOUT_MS,
      responseType: 'text',
      validateStatus: (s) => s >= 200 && s < 300,
    });
    const tag = String(txt.data || '').trim().split(/\s+/)[0];
    return /^[\w.-]+$/.test(tag) ? tag : null;
  }

  _api(url) {
    return this._http.get(url, {
      headers: this._apiHeaders(),
      timeout: GithubReleaseClient.API_TIMEOUT_MS,
      validateStatus: (s) => s >= 200 && s < 500,
    });
  }

  _apiHeaders() {
    return {
      'User-Agent': this._userAgent,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  static _isRelease(res) {
    return res.status === 200 && !!res.data && Array.isArray(res.data.assets);
  }
}

module.exports = GithubReleaseClient;
