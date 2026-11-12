class FrontMatterError extends Error {
  constructor(file, message) {
    super(`${file}: ${message}`);
    this.name = 'FrontMatterError';
    this.file = file;
  }
}

module.exports = FrontMatterError;
