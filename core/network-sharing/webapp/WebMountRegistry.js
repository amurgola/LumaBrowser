const express = require('express');

class WebMountRegistry {
  static RESERVED_PREFIXES = new Set(['/sharing', '/share', '/hooks', '/llm-ui']);

  static normalizePrefix(prefix) {
    const trimmed = String(prefix == null ? '' : prefix).trim().replace(/\/+$/, '');
    if (!trimmed) return null;
    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return normalized === '/' ? null : normalized;
  }

  constructor() {
    this._mounts = new Map();
    this._dispatcher = null;
    this._wiredPrefixes = null;
  }

  register(prefix, { router = null, upgrade = null } = {}) {
    const normalized = WebMountRegistry._validPrefix(prefix);
    WebMountRegistry._assertHandlers(router, upgrade);
    const entry = { router, upgrade };
    this._mounts.set(normalized, entry);
    if (this._dispatcher && !this._wiredPrefixes.has(normalized)) this._wirePrefix(normalized);
    return () => {
      if (this._mounts.get(normalized) === entry) this._mounts.delete(normalized);
    };
  }

  mountFor(pathname) {
    const target = String(pathname || '');
    for (const [prefix, entry] of this._mounts) {
      if (target === prefix || target.startsWith(`${prefix}/`)) return entry;
    }
    return null;
  }

  createDispatcher() {
    this._dispatcher = express.Router();
    this._wiredPrefixes = new Set();
    for (const prefix of this._mounts.keys()) this._wirePrefix(prefix);
    return this._dispatcher;
  }

  dispatchUpgrade(req, socket, head) {
    const pathname = String(req.url || '').split('?')[0];
    const entry = this.mountFor(pathname);
    if (!entry || !entry.upgrade) return false;
    entry.upgrade(req, socket, head);
    return true;
  }

  _wirePrefix(prefix) {
    this._wiredPrefixes.add(prefix);
    this._dispatcher.use(prefix, (req, res, next) => {
      const entry = this._mounts.get(prefix);
      if (!entry || !entry.router) return next();
      return entry.router(req, res, next);
    });
  }

  static _validPrefix(prefix) {
    const normalized = WebMountRegistry.normalizePrefix(prefix);
    if (!normalized) throw new Error('registerMount: a non-root prefix like "/tab" is required');
    if (WebMountRegistry.RESERVED_PREFIXES.has(normalized)) throw new Error(`registerMount: "${normalized}" is reserved by the web backend`);
    return normalized;
  }

  static _assertHandlers(router, upgrade) {
    if (router && typeof router !== 'function') throw new Error('registerMount: router must be an Express router');
    if (upgrade && typeof upgrade !== 'function') throw new Error('registerMount: upgrade must be a function');
  }
}

module.exports = WebMountRegistry;
