const fs = require('fs');
const path = require('path');
const FileLinker = require('../../../shared/fs/FileLinker');
const ImageLibraryFs = require('./ImageLibraryFs');

class ExistingImageModelLinker {
  static link({ sourcePath, destDir, fileName }) {
    if (!sourcePath || !destDir) return { success: false, error: 'A source path and destination folder are required.' };
    const st = ImageLibraryFs.statOrNull(sourcePath);
    if (!st || !st.isFile()) return { success: false, error: 'That file is no longer there. Rescan and try again.' };
    const destPath = path.join(destDir, fileName || path.basename(sourcePath));
    const mkdirError = ExistingImageModelLinker._ensureDir(destDir);
    if (mkdirError) return { success: false, error: mkdirError };
    return ExistingImageModelLinker._resultOf(FileLinker.link(sourcePath, destPath), destPath);
  }

  static _ensureDir(destDir) {
    try {
      fs.mkdirSync(destDir, { recursive: true });
      return null;
    } catch (err) {
      return `Could not create ${destDir}: ${err.message}`;
    }
  }

  static _resultOf(linked, destPath) {
    if (linked.success) return { success: true, destPath, mode: linked.mode };
    if (linked.clash) return linked;
    return { success: false, error: ExistingImageModelLinker._failureMessage(linked.error) };
  }

  static _failureMessage(error) {
    if (process.platform !== 'win32') return `Could not link that file: ${error}`;
    return 'Windows would not let LumaBrowser link to that file (linking needs Developer Mode or admin). '
      + 'Use "Import custom model" to copy it instead.';
  }
}

module.exports = ExistingImageModelLinker;
