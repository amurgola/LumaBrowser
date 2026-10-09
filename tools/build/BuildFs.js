class BuildFs {
  static get() {
    return process.versions.electron ? require('original-fs') : require('fs');
  }
}

module.exports = BuildFs;
