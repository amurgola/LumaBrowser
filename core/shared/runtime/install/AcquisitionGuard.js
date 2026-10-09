const RuntimeInstallError = require('./RuntimeInstallError');

class AcquisitionGuard {
  static entryFor(catalog, id) {
    const entry = catalog.getById(id);
    if (!entry) throw new Error(`Unknown runtime id: ${id}`);
    return entry;
  }

  static assertKind(entry, expectedKind, kindNoun) {
    if (entry.kind !== expectedKind) throw new Error(`Runtime ${entry.id} is not an ${kindNoun} binary.`);
  }

  static assetPatternOrThrow(catalog, entry) {
    if (entry.acquisition === 'manual-source') throw AcquisitionGuard._sourceOnly(entry);
    const assetRegex = catalog.getAssetPattern(entry);
    if (assetRegex) return assetRegex;
    if (entry.manualSourceUrl) throw AcquisitionGuard._sourceOnlyOnThisHost(entry);
    throw AcquisitionGuard._noAssetForPlatform(entry);
  }

  static _sourceOnly(entry) {
    return new RuntimeInstallError(
      `${entry.name} ships source-only. Build it from ${entry.manualSourceUrl || 'the repository'}.`,
      'MANUAL_SOURCE_ONLY',
      { manualSourceUrl: entry.manualSourceUrl || null, manualSourceNote: entry.manualSourceNote || null },
    );
  }

  static _sourceOnlyOnThisHost(entry) {
    return new RuntimeInstallError(
      `${entry.name} has no prebuilt binaries for ${process.platform}-${process.arch}. Build it from ${entry.manualSourceUrl}, then register the binary with Locate.`,
      'MANUAL_SOURCE_ONLY',
      { manualSourceUrl: entry.manualSourceUrl, manualSourceNote: entry.manualSourceNote || null },
    );
  }

  static _noAssetForPlatform(entry) {
    const repo = entry.repo || {};
    return new RuntimeInstallError(
      `No prebuilt asset for ${process.platform}-${process.arch}.`,
      'NO_ASSET_FOR_PLATFORM',
      { acquisition: 'manual', releasesUrl: `https://github.com/${repo.owner}/${repo.repo}/releases` },
    );
  }
}

module.exports = AcquisitionGuard;
