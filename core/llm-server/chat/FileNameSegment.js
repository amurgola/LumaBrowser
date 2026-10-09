class FileNameSegment {
  static MAX_LENGTH = 80;
  static UNSAFE_RUN = /[^A-Za-z0-9._-]+/g;
  static ONLY_DOTS = /^\.+$/;

  static from(value) {
    const segment = String(value == null ? '' : value).replace(FileNameSegment.UNSAFE_RUN, '_').slice(0, FileNameSegment.MAX_LENGTH);
    return FileNameSegment.ONLY_DOTS.test(segment) ? segment.replace(/\./g, '_') : segment;
  }
}

module.exports = FileNameSegment;
