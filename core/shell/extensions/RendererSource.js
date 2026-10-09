const fs = require('fs');
const path = require('path');
const ContainedPath = require('../../shared/fs/ContainedPath');

class RendererSource {
  static read(id, manifest) {
    if (!manifest) return { success: false, error: `Extension "${id}" not found` };
    if (!manifest.renderer) return { success: false, error: `Extension "${id}" has no renderer` };
    try {
      const extDir = path.resolve(manifest._dir);
      const resolved = path.resolve(extDir, manifest.renderer);
      if (!ContainedPath.isWithin(extDir, resolved)) return { success: false, error: 'renderer path escapes the extension directory' };
      return { success: true, content: fs.readFileSync(resolved, 'utf8') };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = RendererSource;
