const HubSources = require('./HubSources');
const ModelRuntimeResolver = require('./ModelRuntimeResolver');
const RuntimeFrameworks = require('./RuntimeFrameworks');

class FrameworksView {
  constructor({ rows, selection, legacyRuntimeId = null, order = [], describeOptions = () => [], current = null }) {
    this._rows = (Array.isArray(rows) ? rows : []).filter((row) => row && row.id);
    this._selection = selection;
    this._legacyRuntimeId = legacyRuntimeId;
    this._order = order;
    this._describeOptions = describeOptions;
    this._current = current;
  }

  static build(options) {
    return new FrameworksView(options).execute();
  }

  execute() {
    const frameworks = RuntimeFrameworks.group(this._rows).map((group) => this._framework(group));
    return { frameworks, formats: this._formats(frameworks), current: this._current };
  }

  _framework(group) {
    const rows = group.buildIds.map((id) => this._rows.find((row) => row.id === id));
    const active = this._activeBuild(group.id, rows.filter(ModelRuntimeResolver.isInstalled));
    return {
      id: group.id,
      name: group.name,
      formats: group.formats,
      installed: !!active,
      activeBuildId: active ? active.id : null,
      builds: rows.map((row) => FrameworksView._build(row, active)),
      options: active ? this._describeOptions(group, active) : [],
    };
  }

  _activeBuild(frameworkId, installed) {
    return ModelRuntimeResolver.pickBuild(installed, [this._selection.activeBuild(frameworkId), this._legacyRuntimeId, ...this._order]);
  }

  _formats(frameworks) {
    const formats = new Map();
    for (const framework of frameworks.filter((candidate) => candidate.installed)) {
      for (const format of framework.formats) {
        if (!formats.has(format)) formats.set(format, []);
        formats.get(format).push(framework.id);
      }
    }
    return Array.from(formats, ([id, frameworkIds]) => this._format(id, frameworkIds));
  }

  _format(id, frameworkIds) {
    const stored = this._selection.formatFramework(id);
    const chosen = frameworkIds.includes(stored);
    const previous = this._frameworkOfRuntime(this._legacyRuntimeId);
    const fallback = frameworkIds.includes(previous) ? previous : frameworkIds[0];
    return {
      id, frameworkIds, defaultFrameworkId: chosen ? stored : fallback, chosen, needsChoice: frameworkIds.length > 1,
      hub: this._hubOf(id),
    };
  }

  _hubOf(format) {
    const source = HubSources.find(this._rows, format);
    return source ? { tag: source.tag, extension: source.extension } : null;
  }

  _frameworkOfRuntime(runtimeId) {
    const row = runtimeId ? this._rows.find((candidate) => candidate.id === runtimeId) : null;
    return row ? RuntimeFrameworks.frameworkIdOf(row) : null;
  }

  static _build(row, active) {
    return {
      id: row.id,
      name: row.name || row.id,
      installed: !!row.installed,
      usable: ModelRuntimeResolver.isInstalled(row),
      version: row.version || null,
      active: !!active && active.id === row.id,
    };
  }
}

module.exports = FrameworksView;
