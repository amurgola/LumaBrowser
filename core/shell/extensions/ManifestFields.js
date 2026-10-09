class ManifestFields {
  static file(definition) {
    if (!definition) return null;
    return typeof definition === 'string' ? definition : definition.file || null;
  }

  static option(definition, key) {
    return definition && typeof definition === 'object' ? definition[key] || null : null;
  }

  static actions(manifest) {
    if (Array.isArray(manifest.extensionsActions)) return manifest.extensionsActions;
    return manifest.extensionsAction ? [manifest.extensionsAction] : [];
  }
}

module.exports = ManifestFields;
