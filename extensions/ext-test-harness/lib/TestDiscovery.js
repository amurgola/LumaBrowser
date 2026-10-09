const fs = require('fs');
const path = require('path');

class TestDiscovery {
  static DEFAULT_TIMEOUT_MS = 300000;
  static TEST_SUFFIX = '.test.js';

  constructor(extensionsDir) {
    this.extensionsDir = extensionsDir;
  }

  scan() {
    const tests = [];
    for (const extDir of this._extensionDirs()) {
      for (const filePath of this._testFiles(extDir)) {
        const meta = TestDiscovery._describe(filePath, extDir);
        if (meta) tests.push(meta);
      }
    }
    return tests;
  }

  loadTest(testId) {
    const meta = this.scan().find((t) => t.id === testId);
    if (!meta) return null;
    return { descriptor: TestDiscovery._freshRequire(meta.filePath), filePath: meta.filePath };
  }

  _extensionDirs() {
    try {
      return fs.readdirSync(this.extensionsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
    } catch (err) {
      console.error('TestDiscovery: failed to read extensions dir:', err.message);
      return [];
    }
  }

  _testFiles(extDir) {
    const testsDir = path.join(this.extensionsDir, extDir, 'tests');
    if (!fs.existsSync(testsDir)) return [];
    try {
      return fs.readdirSync(testsDir).filter((f) => f.endsWith(TestDiscovery.TEST_SUFFIX)).map((f) => path.join(testsDir, f));
    } catch (err) {
      console.error(`TestDiscovery: failed to read ${testsDir}:`, err.message);
      return [];
    }
  }

  static _describe(filePath, extDir) {
    try {
      const descriptor = TestDiscovery._freshRequire(filePath);
      if (!descriptor.id || !descriptor.name || typeof descriptor.run !== 'function') {
        console.warn(`TestDiscovery: skipping ${filePath}: missing required fields (id, name, run)`);
        return null;
      }
      return {
        id: descriptor.id,
        name: descriptor.name,
        suite: descriptor.suite || extDir,
        filePath,
        variants: descriptor.variants || [],
        timeout: descriptor.timeout || TestDiscovery.DEFAULT_TIMEOUT_MS,
      };
    } catch (err) {
      console.error(`TestDiscovery: failed to load ${filePath}:`, err.message);
      return null;
    }
  }

  static _freshRequire(filePath) {
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  }
}

module.exports = TestDiscovery;
