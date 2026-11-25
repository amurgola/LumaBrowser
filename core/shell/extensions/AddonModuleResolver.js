const path = require('path');
const NodeModule = require('module');

class AddonModuleResolver {
  static NOT_FOUND = 'MODULE_NOT_FOUND';

  constructor({ addonsDir, bundledDir, moduleApi = NodeModule }) {
    this._addonsDir = path.resolve(addonsDir);
    this._bundledDir = path.resolve(bundledDir);
    this._appRoot = path.dirname(this._bundledDir);
    this._module = moduleApi;
    this._original = null;
  }

  install() {
    if (this._original) return;
    const original = this._module._resolveFilename;
    const resolver = this;
    this._original = original;
    this._module._resolveFilename = function resolveFilename(request, parent, ...rest) {
      try {
        return original.call(this, request, parent, ...rest);
      } catch (err) {
        const retry = err && err.code === AddonModuleResolver.NOT_FOUND ? resolver.fallback(request, parent) : null;
        if (!retry) throw err;
        try {
          return original.call(this, retry.request, parent, rest[0], retry.options);
        } catch (_) {
          throw err;
        }
      }
    };
  }

  uninstall() {
    if (!this._original) return;
    this._module._resolveFilename = this._original;
    this._original = null;
  }

  fallback(request, parent) {
    const from = parent && parent.filename;
    if (!from || !this._isInside(this._addonsDir, from)) return null;
    if (AddonModuleResolver._isRelative(request)) return this._rebased(request, from);
    if (path.isAbsolute(request)) return null;
    return { request, options: { paths: [this._appRoot] } };
  }

  _rebased(request, from) {
    const target = path.resolve(path.dirname(from), request);
    if (this._isInside(this._addonRootOf(from), target)) return null;
    return { request: path.join(this._bundledDir, path.relative(this._addonsDir, target)), options: undefined };
  }

  _addonRootOf(file) {
    const [id] = path.relative(this._addonsDir, file).split(path.sep);
    return path.join(this._addonsDir, id);
  }

  _isInside(dir, file) {
    const rel = path.relative(dir, path.resolve(file));
    return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  }

  static _isRelative(request) {
    return request === '.' || request === '..' || /^\.\.?[\\/]/.test(request);
  }
}

module.exports = AddonModuleResolver;
