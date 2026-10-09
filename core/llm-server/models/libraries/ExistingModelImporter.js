const fs = require('fs');
const path = require('path');
const FileLinker = require('../../../shared/fs/FileLinker');
const FileProbe = require('./FileProbe');

class ExistingModelImporter {
  static SUBDIRECTORY = 'imported';

  static importModel({ sourcePath, fileName, modelsDir } = {}) {
    if (!sourcePath || !modelsDir) return ExistingModelImporter._failure('A source path and models directory are required.');
    const stats = FileProbe.stat(sourcePath);
    if (!stats || !stats.isFile()) return ExistingModelImporter._failure('That file is no longer there. Rescan and try again.');
    const base = ExistingModelImporter._ggufName(fileName || path.basename(sourcePath));
    const destDir = path.join(modelsDir, ExistingModelImporter.SUBDIRECTORY);
    const directoryError = ExistingModelImporter._createDirectory(destDir);
    if (directoryError) return ExistingModelImporter._failure(directoryError);
    return ExistingModelImporter._link(sourcePath, path.join(destDir, base), base);
  }

  static _ggufName(name) {
    const base = String(name);
    return /\.gguf$/i.test(base) ? base : `${base}.gguf`;
  }

  static _createDirectory(destDir) {
    try {
      fs.mkdirSync(destDir, { recursive: true });
      return null;
    } catch (error) {
      return `Could not create ${destDir}: ${error.message}`;
    }
  }

  static _link(sourcePath, destPath, base) {
    const linked = FileLinker.link(sourcePath, destPath);
    if (linked.success) return { success: true, destPath, mode: linked.mode };
    if (linked.clash) return ExistingModelImporter._failure(`${base} already exists in your models folder.`);
    return ExistingModelImporter._failure(ExistingModelImporter._linkRefusedMessage(linked.error));
  }

  static _linkRefusedMessage(error) {
    if (process.platform !== 'win32') return `Could not link that file: ${error}`;
    return 'Windows would not let LumaBrowser link to that file (linking needs Developer Mode or admin). '
      + 'You can instead point your models directory at that folder in Setup.';
  }

  static _failure(error) {
    return { success: false, error };
  }
}

module.exports = ExistingModelImporter;
