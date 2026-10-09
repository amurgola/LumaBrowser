const RuntimeInstallError = require('./RuntimeInstallError');

class ReleaseAssetResolver {
  constructor(releaseClient) {
    this._client = releaseClient;
  }

  async resolve(repo, assetRegex, { prerelease = false } = {}) {
    const preferred = prerelease ? await this._client.newestReleaseWithAsset(repo, assetRegex, null) : null;
    if (preferred) return preferred;
    const release = await this._client.latestRelease(repo);
    const asset = (release.assets || []).find((a) => assetRegex.test(a.name));
    if (asset) return { release, asset };
    return this._fallbackOrThrow(repo, assetRegex, release);
  }

  async _fallbackOrThrow(repo, assetRegex, release) {
    const fallback = await this._client.newestReleaseWithAsset(repo, assetRegex, release.tag_name);
    if (fallback) return fallback;
    throw new RuntimeInstallError(
      `Release ${release.tag_name} has no asset matching ${assetRegex} on this host, and no recent release does either.`,
      'ASSET_NOT_FOUND',
      { releasesUrl: release.html_url },
    );
  }
}

module.exports = ReleaseAssetResolver;
