const RuntimeHardwareCheck = require('./RuntimeHardwareCheck');

class RuntimeDetailFields {
  static stamp(detail, { entry, catalog, manualBinaryPath, hooks, cuda, gpu }) {
    RuntimeDetailFields._identity(detail, entry, manualBinaryPath);
    RuntimeDetailFields._acquisition(detail, entry, catalog, hooks);
    RuntimeDetailFields._launchShape(detail, entry);
    detail.hardware = RuntimeHardwareCheck.evaluate(entry, { cuda, gpu });
    return detail;
  }

  static _identity(detail, entry, manualBinaryPath) {
    detail.manualBinaryPath = manualBinaryPath;
    detail.id = entry.id;
    detail.name = entry.name;
    detail.kind = entry.kind;
    detail.description = entry.description;
    detail.requirementNote = entry.requirementNote || null;
  }

  static _acquisition(detail, entry, catalog, hooks) {
    detail.assetSupported = !!catalog.getAssetPattern(entry);
    detail.repo = typeof catalog.getRepo === 'function' ? catalog.getRepo(entry) : entry.repo;
    detail.acquisition = entry.acquisition || RuntimeDetailFields._inferredAcquisition(detail.assetSupported, entry);
    detail.supportsManualRegister = detail.acquisition === 'manual-source';
    detail.manualSourceUrl = entry.manualSourceUrl || null;
    detail.manualSourceNote = entry.manualSourceNote || null;
    detail.installable = detail.assetSupported || !!(hooks && typeof hooks.install === 'function');
  }

  static _inferredAcquisition(assetSupported, entry) {
    if (assetSupported) return 'github-release';
    return entry.manualSourceUrl ? 'manual-source' : 'manual';
  }

  static _launchShape(detail, entry) {
    detail.unsupportedFlags = RuntimeDetailFields._copy(entry.unsupportedFlags) || [];
    detail.skipFeatures = RuntimeDetailFields._copy(entry.skipFeatures) || [];
    detail.extraArgs = RuntimeDetailFields._copy(entry.extraArgs) || [];
    detail.launchStyle = entry.launchStyle || null;
    detail.specDialect = entry.specDialect || null;
    detail.platforms = RuntimeDetailFields._copy(entry.platforms);
    detail.modelKinds = Array.isArray(entry.modelKinds) && entry.modelKinds.length > 0 ? entry.modelKinds.slice() : null;
  }

  static _copy(list) {
    return Array.isArray(list) ? list.slice() : null;
  }
}

module.exports = RuntimeDetailFields;
