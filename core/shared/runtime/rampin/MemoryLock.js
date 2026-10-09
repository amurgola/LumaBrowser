class MemoryLock {
  prepare(_totalBytes) {
    throw new Error(`${this.constructor.name} must implement prepare(totalBytes)`);
  }

  mapFile(_file) {
    throw new Error(`${this.constructor.name} must implement mapFile(file)`);
  }

  lockAsync(_address, _length) {
    throw new Error(`${this.constructor.name} must implement lockAsync(address, length)`);
  }
}

module.exports = MemoryLock;
