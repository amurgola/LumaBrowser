export default class FrameworkStore {
  constructor() {
    this.view = null;
  }

  setView(view) {
    this.view = view || null;
  }

  async load(api) {
    if (!api || typeof api.getFrameworksView !== 'function') return this.view;
    try {
      const res = await api.getFrameworksView();
      if (res && res.success) this.setView(res.view);
    } catch (_) {}
    return this.view;
  }

  get(frameworkId) {
    return this._frameworks().find((framework) => framework.id === frameworkId) || null;
  }

  current() {
    return (this.view && this.view.current) || null;
  }

  nameOf(frameworkId) {
    const framework = this.get(frameworkId);
    return framework ? framework.name : (frameworkId || '');
  }

  buildName(runtimeId) {
    for (const framework of this._frameworks()) {
      const build = (framework.builds || []).find((candidate) => candidate.id === runtimeId);
      if (build) return build.name;
    }
    return runtimeId || '';
  }

  format(formatId) {
    return ((this.view && this.view.formats) || []).find((format) => format.id === formatId) || null;
  }

  _frameworks() {
    return (this.view && this.view.frameworks) || [];
  }
}
