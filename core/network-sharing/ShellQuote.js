class ShellQuote {
  static powershell(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  static posix(value) {
    return `'${String(value).replace(/'/g, "'\\''")}'`;
  }
}

module.exports = ShellQuote;
