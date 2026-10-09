const ImageModelCatalog = require('./ImageModelCatalog');

class ImageModelName {
  static WEIGHT_EXTENSION = /\.(gguf|safetensors|ckpt|bin|pth|pt)$/i;

  static key(filePath) {
    if (!filePath) return '';
    const last = String(filePath).split(/[\\/]/).pop() || '';
    return last.replace(ImageModelName.WEIGHT_EXTENSION, '');
  }

  static resolveDisplayName({ stem, overrides } = {}, catalog = new ImageModelCatalog()) {
    if (!stem) return '';
    const override = ImageModelName._override(stem, overrides);
    if (override) return override;
    const row = ImageModelName._catalogRow(stem, catalog);
    if (row && row.label) return row.label;
    return ImageModelName.prettify(stem);
  }

  static prettify(stem) {
    return String(stem).replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  static _override(stem, overrides) {
    if (!overrides || typeof overrides !== 'object' || !overrides[stem]) return null;
    return String(overrides[stem]).trim();
  }

  static _catalogRow(stem, catalog) {
    return catalog.list().find((row) => row.id === stem || ImageModelName._diffusionKey(row) === stem);
  }

  static _diffusionKey(row) {
    const file = row.files && row.files.diffusion && row.files.diffusion.file;
    return file ? ImageModelName.key(file) : null;
  }
}

module.exports = ImageModelName;
