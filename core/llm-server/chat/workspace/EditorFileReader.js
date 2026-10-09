const fs = require('fs');
const path = require('path');

class EditorFileReader {
  static MAX_READ_BYTES = 2 * 1024 * 1024;
  static MAX_IMAGE_BYTES = 6 * 1024 * 1024;
  static BINARY_SNIFF_BYTES = 8192;
  static IMAGE_MIME = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
    '.webp': 'image/webp', '.bmp': 'image/bmp', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  };

  static read(absPath, relPath) {
    const stat = fs.statSync(absPath);
    if (!stat.isFile()) return { success: false, error: 'Not a file.' };
    const ext = path.extname(absPath).toLowerCase();
    if (EditorFileReader.IMAGE_MIME[ext] && ext !== '.svg') return EditorFileReader._readImage(absPath, relPath, ext, stat.size);
    return EditorFileReader._readText(absPath, relPath, stat.size);
  }

  static _readImage(absPath, relPath, ext, size) {
    if (size > EditorFileReader.MAX_IMAGE_BYTES) return { success: false, error: 'Image is too large to preview.' };
    const base64 = fs.readFileSync(absPath).toString('base64');
    return { success: true, path: relPath, image: true, dataUrl: `data:${EditorFileReader.IMAGE_MIME[ext]};base64,${base64}`, size };
  }

  static _readText(absPath, relPath, size) {
    if (size > EditorFileReader.MAX_READ_BYTES) {
      return { success: false, error: `File is too large to open (${Math.round(size / 1024)} KB).`, tooLarge: true };
    }
    const buffer = fs.readFileSync(absPath);
    if (buffer.subarray(0, EditorFileReader.BINARY_SNIFF_BYTES).includes(0)) {
      return { success: false, error: 'This is a binary file, so it cannot be edited here.', binary: true };
    }
    return { success: true, path: relPath, content: buffer.toString('utf8'), size };
  }
}

module.exports = EditorFileReader;
