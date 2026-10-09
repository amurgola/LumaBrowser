const path = require('path');
const AssetDownload = require('./AssetDownload');
const ArchiveExtractor = require('./ArchiveExtractor');
const InstallEvents = require('./InstallEvents');
const ManagedDir = require('./ManagedDir');

class CompanionAssets {
  constructor({ userAgent, http, extractor = ArchiveExtractor }) {
    this._userAgent = userAgent;
    this._http = http;
    this._extractor = extractor;
  }

  async install({ specs, release, entry, runtimesRoot, managedDir, emit }) {
    const outcomes = [];
    for (const spec of specs) {
      const source = this._sourceFor(spec, release);
      if (source.status) {
        outcomes.push({ pattern: String(spec), name: null, status: source.status });
        continue;
      }
      emit('resolved', { release: InstallEvents.releaseFields(release), asset: source.eventAsset, kind: 'companion' });
      outcomes.push(await this._installOne(source, { entry, runtimesRoot, managedDir, emit }));
    }
    return outcomes;
  }

  _sourceFor(spec, release) {
    if (spec instanceof RegExp) return CompanionAssets._fromRelease(spec, release);
    if (spec && spec.url) return CompanionAssets._fromUrl(spec);
    return { status: 'invalid-spec' };
  }

  static _fromRelease(pattern, release) {
    const asset = (release.assets || []).find((a) => pattern.test(a.name));
    if (!asset) return { status: 'no-match' };
    return {
      name: asset.name,
      url: asset.browser_download_url,
      size: asset.size,
      extractGlobs: null,
      eventAsset: InstallEvents.assetFields(asset),
    };
  }

  static _fromUrl(spec) {
    const name = spec.name || path.basename(new URL(spec.url).pathname);
    return {
      name,
      url: spec.url,
      size: null,
      extractGlobs: Array.isArray(spec.extractGlobs) ? spec.extractGlobs : null,
      eventAsset: { name, size: null },
    };
  }

  async _installOne(source, { entry, runtimesRoot, managedDir, emit }) {
    const stagingPath = ManagedDir.stagingPathFor(runtimesRoot, entry.id, source.name, 'companion');
    const sha256 = await AssetDownload.toFile(source.url, stagingPath, {
      userAgent: this._userAgent,
      http: this._http,
      onProgress: (received, total) => emit('download', { received, total, kind: 'companion' }),
    });
    emit('extract', { phase: 'start', kind: 'companion' });
    await this._extractor.extract(stagingPath, managedDir, { globs: source.extractGlobs });
    emit('extract', { phase: 'done', kind: 'companion' });
    ManagedDir.removeQuietly(stagingPath);
    return { name: source.name, url: source.url, size: source.size, sha256, status: 'installed' };
  }
}

module.exports = CompanionAssets;
