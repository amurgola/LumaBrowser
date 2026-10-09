class PathEntries {
  static includes(pathValue, dir, delimiter = ';') {
    const wanted = PathEntries._normalize(dir);
    return String(pathValue || '').split(delimiter).some((entry) => PathEntries._normalize(entry) === wanted);
  }

  static _normalize(entry) {
    return String(entry || '').trim().replace(/[\\/]+$/, '').toLowerCase();
  }
}

module.exports = PathEntries;
