const fs = require('fs');
const path = require('path');

class RuntimeManifest {
  static FILE_NAME = 'manifest.json';

  static build({ entry, release, asset, sha256, companions, binaryPath, managedDir, prerelease }) {
    return {
      id: entry.id,
      installedAt: new Date().toISOString(),
      release: RuntimeManifest._releaseBlock(release, prerelease),
      asset: { name: asset.name, url: asset.browser_download_url, size: asset.size, sha256 },
      companions,
      binary: path.relative(managedDir, binaryPath),
    };
  }

  static async write(managedDir, manifest) {
    await fs.promises.writeFile(RuntimeManifest.pathIn(managedDir), JSON.stringify(manifest, null, 2), 'utf8');
  }

  static async read(managedDir) {
    try {
      return JSON.parse(await fs.promises.readFile(RuntimeManifest.pathIn(managedDir), 'utf8'));
    } catch (_) {
      return null;
    }
  }

  static pathIn(managedDir) {
    return path.join(managedDir, RuntimeManifest.FILE_NAME);
  }

  static _releaseBlock(release, prerelease) {
    return {
      tag: release.tag_name,
      url: release.html_url,
      publishedAt: release.published_at,
      channel: prerelease ? 'prerelease' : 'stable',
      prerelease: !!release.prerelease,
    };
  }
}

module.exports = RuntimeManifest;
