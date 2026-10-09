class ModelFileUpdates {
  static findFileUpdates(model, catalog) {
    const source = ModelFileUpdates.catalogSourceFor(model, catalog);
    const installedFiles = (model && model.files) || null;
    if (!source || !source.files || !installedFiles) return [];
    return Object.keys(source.files)
      .map((role) => ModelFileUpdates._updateForRole(role, source.files[role], installedFiles[role]))
      .filter(Boolean);
  }

  static catalogSourceFor(model, catalog) {
    if (!model || !Array.isArray(catalog)) return null;
    const byId = model.id ? catalog.find((entry) => entry && entry.id === model.id) : null;
    if (byId) return byId;
    if (!model.family) return null;
    return catalog.find((entry) => ModelFileUpdates._shipsFilesForFamily(entry, model.family)) || null;
  }

  static _shipsFilesForFamily(entry, family) {
    return !!entry && entry.family === family && !!entry.files && Object.keys(entry.files).length > 0;
  }

  static _updateForRole(role, catalogFile, installed) {
    if (!catalogFile || !installed) return null;
    if (!Array.isArray(catalogFile.supersedes) || !catalogFile.supersedes.length) return null;
    const have = String(installed.file || installed.name || '');
    if (!have || have === catalogFile.file || !catalogFile.supersedes.includes(have)) return null;
    return {
      role,
      file: catalogFile.file,
      url: catalogFile.url,
      approxBytes: catalogFile.approxBytes || 0,
      replaces: have,
      note: catalogFile.updateNote || null,
      ...(catalogFile.loaderFlag ? { loaderFlag: catalogFile.loaderFlag } : {}),
    };
  }
}

module.exports = ModelFileUpdates;
