const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ModelDownload = require('../models/ModelDownload');
const DownloadVerifier = require('../../shared/download/DownloadVerifier');

class RouterModelDownloader {
  static MODELS_INDEX_URL = 'https://lumabyte.com/install/models/index.json';
  static MANIFEST_TIMEOUT_MS = 15000;

  constructor({ modelFile, http = axios, startDownload = (o) => ModelDownload.start(o) }) {
    this._modelFile = modelFile;
    this._http = http;
    this._startDownload = startDownload;
    this._active = null;
  }

  progress() {
    return this._active ? { received: this._active.received, total: this._active.total } : null;
  }

  isActive() {
    return !!this._active;
  }

  cancel() {
    if (this._active && this._active.handle) this._active.handle.cancel();
  }

  async download({ destPath, indexUrl = RouterModelDownloader.MODELS_INDEX_URL }) {
    const stagePath = `${destPath}.download`;
    try {
      const entry = await this._manifestEntry(indexUrl);
      await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
      const result = await this._transfer(entry, stagePath);
      if (!result || !result.success) return RouterModelDownloader._unfinished(result);
      await this._verifyAndInstall(stagePath, destPath, entry);
      console.log(`[group-router] downloaded ${this._modelFile} (${result.resumed ? 'resumed' : 'fresh'})`);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err && err.message) || String(err) };
    } finally {
      this._active = null;
    }
  }

  async _manifestEntry(indexUrl) {
    const index = await this._http.get(indexUrl, { timeout: RouterModelDownloader.MANIFEST_TIMEOUT_MS });
    const models = (index.data && index.data.models) || [];
    const entry = models.find((m) => m && m.name === this._modelFile);
    if (!entry || !entry.url || !entry.sha256) throw new Error(`${this._modelFile} is not listed in the model manifest.`);
    return entry;
  }

  _transfer(entry, stagePath) {
    const active = { handle: null, received: 0, total: Number(entry.size) || 0 };
    active.handle = this._startDownload({
      url: entry.url,
      destPath: stagePath,
      onEvent: (type, p) => {
        if (type === 'download' && p) { active.received = p.received || 0; active.total = p.total || active.total; }
      },
    });
    this._active = active;
    return active.handle.promise;
  }

  static _unfinished(result) {
    if (result && (result.canceled || result.paused)) return { ok: false, error: null };
    throw new Error('Router model download failed.');
  }

  async _verifyAndInstall(stagePath, destPath, entry) {
    const digest = await DownloadVerifier.sha256File(stagePath);
    if (digest !== String(entry.sha256).toLowerCase()) {
      await fs.promises.rm(stagePath, { force: true });
      throw new Error('Router model download failed its SHA-256 check.');
    }
    await fs.promises.rename(stagePath, destPath);
  }
}

module.exports = RouterModelDownloader;
