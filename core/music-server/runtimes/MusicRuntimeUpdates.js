const axios = require('axios');
const MusicRuntimeCatalog = require('./MusicRuntimeCatalog');

class MusicRuntimeUpdates {
  static TTL_MS = 6 * 60 * 60 * 1000;
  static TIMEOUT_MS = 15000;
  static ERROR_MAX = 200;

  constructor({ catalog = new MusicRuntimeCatalog(), http = axios } = {}) {
    this._catalog = catalog;
    this._http = http;
    this._cache = new Map();
  }

  async check({ view, userAgent } = {}) {
    if (!view || !Array.isArray(view.runtimes)) return view;
    for (const row of view.runtimes) {
      const target = this._eligibleTarget(row);
      if (target) row.update = await this._updateFor(target, userAgent);
    }
    return view;
  }

  async latestVersion(project, { userAgent } = {}) {
    const hit = this._cache.get(project);
    if (hit && Date.now() - hit.at < MusicRuntimeUpdates.TTL_MS) return hit.version;
    const version = await this._fetchVersion(project, userAgent);
    this._cache.set(project, { at: Date.now(), version });
    return version;
  }

  clearCache() {
    this._cache.clear();
  }

  static compareVersions(a, b) {
    const pa = MusicRuntimeUpdates._segments(a);
    const pb = MusicRuntimeUpdates._segments(b);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i] || 0) - (pb[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  _eligibleTarget(row) {
    if (!row.installed || row.acquisition !== 'python-env' || row.source !== 'managed') return null;
    const entry = this._catalog.getById(row.id);
    const project = entry && entry.pypi && entry.pypi.project;
    const current = row.version || (row.manifest && row.manifest.package && row.manifest.package.version);
    return project && current ? { project, current } : null;
  }

  async _updateFor({ project, current }, userAgent) {
    try {
      const latest = await this.latestVersion(project, { userAgent });
      return {
        available: MusicRuntimeUpdates.compareVersions(latest, current) > 0,
        current,
        latest,
        url: `https://pypi.org/project/${project}/`,
      };
    } catch (err) {
      return { available: false, current, latest: null, error: String(err.message || err).slice(0, MusicRuntimeUpdates.ERROR_MAX) };
    }
  }

  async _fetchVersion(project, userAgent) {
    const res = await this._http.get(`https://pypi.org/pypi/${project}/json`, {
      headers: { 'User-Agent': userAgent || 'LumaBrowser' },
      timeout: MusicRuntimeUpdates.TIMEOUT_MS,
    });
    const version = res.data && res.data.info && res.data.info.version;
    if (!version) throw new Error(`PyPI returned no version for ${project}.`);
    return version;
  }

  static _segments(version) {
    return String(version).split('.').map((s) => parseInt(s, 10) || 0);
  }
}

module.exports = MusicRuntimeUpdates;
