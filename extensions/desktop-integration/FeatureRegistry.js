const express = require('express');
const FeatureSettings = require('./FeatureSettings');
const FeatureSettingsSchema = require('./FeatureSettingsSchema');

class FeatureRegistry {
  static ENABLED_KEY = 'featureEnabled';

  constructor({ db, buildDeps, onChange = () => {}, log = console, routerFactory = () => express.Router() }) {
    this._db = db;
    this._buildDeps = buildDeps;
    this._onChange = onChange;
    this._log = log;
    this._routerFactory = routerFactory;
    this._entries = new Map();
    this._failed = [];
  }

  load({ loaded = [], failed = [] }) {
    this._failed = failed.map((f) => ({ ...f }));
    for (const f of this._failed) this._log.error(`desktop-integration: feature folder "${f.folder}" skipped: ${f.error}`);
    for (const descriptor of loaded) {
      this._entries.set(descriptor.id, { descriptor, instance: null, router: null, deps: null, error: null });
      if (this.isEnabled(descriptor.id)) this._start(descriptor.id);
    }
  }

  isEnabled(id) {
    const entry = this._entries.get(id);
    if (!entry) return false;
    const stored = this._toggles()[id];
    return typeof stored === 'boolean' ? stored : entry.descriptor.defaultEnabled;
  }

  enabledIds() {
    return [...this._entries.values()].filter((e) => e.router).map((e) => e.descriptor.id);
  }

  setEnabled(id, enabled) {
    const entry = this._entries.get(id);
    if (!entry) throw new Error(`Unknown feature "${id}"`);
    this._db.set(FeatureRegistry.ENABLED_KEY, { ...this._toggles(), [id]: !!enabled });
    if (enabled && !entry.router) this._start(id);
    if (!enabled) this._stop(id);
    this._onChange();
    return this.describe(id);
  }

  setSetting(id, key, value) {
    const entry = this._entries.get(id);
    if (!entry) throw new Error(`Unknown feature "${id}"`);
    const stored = FeatureSettingsSchema.coerce(entry.descriptor.settingsSchema || [], String(key || ''), value);
    new FeatureSettings(this._db, id).set(key, stored);
    const hook = entry.instance && entry.instance.onSettingsChanged;
    if (typeof hook === 'function') {
      try { hook.call(entry.instance, key, stored); } catch (err) {
        this._log.warn(`desktop-integration: feature "${id}" onSettingsChanged failed: ${(err && err.message) || err}`);
      }
    }
    return this.describe(id);
  }

  routerFor(id) {
    const entry = this._entries.get(id);
    return entry ? entry.router : null;
  }

  has(id) {
    return this._entries.has(id);
  }

  list() {
    return [...this._entries.keys()].map((id) => this.describe(id));
  }

  failed() {
    return this._failed.map((f) => ({ ...f }));
  }

  describe(id) {
    const { descriptor, router, error } = this._entries.get(id);
    return {
      id,
      label: descriptor.label,
      description: descriptor.description,
      defaultEnabled: descriptor.defaultEnabled,
      enabled: this.isEnabled(id),
      running: !!router,
      error,
      settings: FeatureSettingsSchema.withValues(descriptor.settingsSchema || [], new FeatureSettings(this._db, id)),
    };
  }

  disposeAll() {
    for (const id of this._entries.keys()) this._stop(id);
  }

  _start(id) {
    const entry = this._entries.get(id);
    try {
      const deps = this._buildDeps(entry.descriptor);
      const instance = entry.descriptor.create(deps) || {};
      const router = this._routerFactory();
      if (typeof instance.mount === 'function') instance.mount(router);
      Object.assign(entry, { instance, router, deps, error: null });
    } catch (err) {
      entry.error = (err && err.message) || String(err);
      this._disposeDeps(entry);
      Object.assign(entry, { instance: null, router: null, deps: null });
      this._log.error(`desktop-integration: feature "${id}" failed to start: ${entry.error}`);
    }
  }

  _stop(id) {
    const entry = this._entries.get(id);
    if (!entry || !entry.instance) return;
    try {
      if (typeof entry.instance.dispose === 'function') entry.instance.dispose();
    } catch (err) {
      this._log.warn(`desktop-integration: feature "${id}" dispose failed: ${(err && err.message) || err}`);
    }
    this._disposeDeps(entry);
    Object.assign(entry, { instance: null, router: null, deps: null });
  }

  _disposeDeps(entry) {
    const dispose = entry.deps && entry.deps[FeatureRegistry.DISPOSE];
    if (typeof dispose === 'function') { try { dispose(); } catch (_) {} }
  }

  _toggles() {
    const stored = this._db.get(FeatureRegistry.ENABLED_KEY, {});
    return stored && typeof stored === 'object' ? stored : {};
  }
}

FeatureRegistry.DISPOSE = Symbol.for('desktop-integration.deps.dispose');

module.exports = FeatureRegistry;
