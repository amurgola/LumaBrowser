const fs = require('fs');
const path = require('path');
const VsixManifest = require('./VsixManifest');
const FileTree = require('./FileTree');

class VsixArchiver {
  static ENTRY_DATE = new Date('2020-01-01T00:00:00Z');

  static zip(stagedDir, vsixPath, manifest, archiverFactory = () => require('archiver')('zip', { zlib: { level: 9 } })) {
    return new Promise((resolve, reject) => {
      const tmp = `${vsixPath}.tmp`;
      const out = fs.createWriteStream(tmp);
      const zip = archiverFactory();
      out.on('close', () => { fs.rmSync(vsixPath, { force: true }); fs.renameSync(tmp, vsixPath); resolve(); });
      zip.on('error', reject);
      zip.on('warning', reject);
      zip.pipe(out);
      VsixArchiver._addEntries(zip, stagedDir, manifest);
      zip.finalize();
    });
  }

  static _addEntries(zip, stagedDir, manifest) {
    const date = VsixArchiver.ENTRY_DATE;
    const files = FileTree.list(stagedDir).sort();
    const exts = files.map((f) => path.extname(f).toLowerCase()).filter(Boolean);
    zip.append(VsixManifest.contentTypes(exts), { name: '[Content_Types].xml', date });
    zip.append(VsixManifest.packageManifest(manifest), { name: 'extension.vsixmanifest', date });
    for (const f of files) zip.file(path.join(stagedDir, f), { name: `extension/${f}`, date });
  }
}

module.exports = VsixArchiver;
