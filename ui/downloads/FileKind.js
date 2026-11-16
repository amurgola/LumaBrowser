export default class FileKind {
  static EXTENSIONS = {
    document: ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt', 'md', 'epub', 'ppt', 'pptx', 'odp'],
    sheet: ['xls', 'xlsx', 'xlsm', 'ods', 'csv', 'tsv'],
    image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'tif', 'tiff', 'heic'],
    video: ['mp4', 'mkv', 'webm', 'mov', 'avi', 'wmv', 'm4v'],
    audio: ['mp3', 'wav', 'flac', 'ogg', 'opus', 'm4a', 'aac', 'wma'],
    archive: ['zip', '7z', 'rar', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zst', 'iso'],
    app: ['exe', 'msi', 'msix', 'appx', 'dmg', 'pkg', 'appimage', 'deb', 'rpm', 'apk', 'bat', 'cmd', 'ps1', 'sh'],
  };

  static OTHER = 'file';

  static of(filename) {
    const extension = FileKind._extension(filename);
    const kind = Object.keys(FileKind.EXTENSIONS).find((name) => FileKind.EXTENSIONS[name].includes(extension));
    return kind || FileKind.OTHER;
  }

  static _extension(filename) {
    const name = String(filename || '');
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  }
}
