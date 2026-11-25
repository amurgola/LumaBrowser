const path = require('path');
const { pathToFileURL } = require('url');

class AddonRendererModule {
  static describe(manifest, bundledDir, bundledFolders) {
    const addonsDir = path.dirname(path.resolve(manifest._dir));
    const userRoot = AddonRendererModule._dirUrl(path.dirname(addonsDir));
    const appRoot = AddonRendererModule._dirUrl(path.dirname(path.resolve(bundledDir)));
    const userAddons = `${userRoot}extensions/`;
    const imports = { [userRoot]: appRoot, [userAddons]: userAddons };
    for (const folder of bundledFolders) imports[`${userAddons}${encodeURIComponent(folder)}/`] = `${appRoot}extensions/${encodeURIComponent(folder)}/`;
    return { url: pathToFileURL(path.resolve(manifest._dir, manifest.renderer)).href, imports };
  }

  static _dirUrl(dir) {
    const href = pathToFileURL(dir).href;
    return href.endsWith('/') ? href : `${href}/`;
  }
}

module.exports = AddonRendererModule;
