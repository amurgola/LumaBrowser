class ContextSurface {
  get key() {
    throw new Error(`${this.constructor.name} must define key`);
  }

  forExtension(extensionId) {
    throw new Error(`${this.constructor.name} must implement forExtension(${extensionId})`);
  }
}

module.exports = ContextSurface;
