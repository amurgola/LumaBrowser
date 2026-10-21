class ManifestFields {
  static file(definition) {
    if (!definition) return null;
    return typeof definition === 'string' ? definition : definition.file || null;
  }

  static option(definition, key) {
    return definition && typeof definition === 'object' ? definition[key] || null : null;
  }
}

module.exports = ManifestFields;
