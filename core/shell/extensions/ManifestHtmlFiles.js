const fs = require('fs');
const path = require('path');

class ManifestHtmlFiles {
  static resolve(manifest) {
    if (manifest.navigationBar && manifest.navigationBar.panel) ManifestHtmlFiles._inline(manifest, manifest.navigationBar.panel);
    if (manifest.settings) ManifestHtmlFiles._inline(manifest, manifest.settings);
  }

  static _inline(manifest, ui) {
    if (!ui || !ui.htmlFile || ui.html) return;
    const filePath = path.resolve(manifest._dir, ui.htmlFile);
    if (fs.existsSync(filePath)) {
      ui._resolvedHtml = fs.readFileSync(filePath, 'utf8');
      return;
    }
    console.warn(`ExtensionManager: HTML file not found for "${manifest.id}": ${filePath}`);
    ui._resolvedHtml = `<div class="ext-error">Missing: ${ui.htmlFile}</div>`;
  }
}

module.exports = ManifestHtmlFiles;
