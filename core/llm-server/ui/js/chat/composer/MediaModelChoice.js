import Dom from '../../dom/Dom.js';
import ImageDefaultsMarkup from '../../image-setup/ImageDefaultsMarkup.js';

export default class MediaModelChoice {
  static META_KEY = 'mediaModels';

  static JOBS = [
    { job: 'image', field: 'modelId', group: 'gen', role: 'generate', label: 'Image', noDefault: 'none', hint: 'The model that draws this chat\'s images.' },
    { job: 'edit', field: 'editModelId', group: 'edit', role: 'edit', label: 'Image editor', noDefault: 'the image model', hint: 'The model that edits images in this chat.' },
    { job: 'video', field: 'videoModelId', group: 'video', role: 'video', label: 'Video', noDefault: 'none', hint: 'The model that renders this chat\'s videos.' },
  ];

  constructor(ctx) {
    this._ctx = ctx;
  }

  available() {
    const api = this._ctx.api;
    return !!(api && api.image && typeof api.image.getModelsView === 'function' && api.conv && api.conv.meta);
  }

  async restore(conversationId) {
    const { state, api } = this._ctx;
    state.mediaModels = null;
    if (!conversationId || !this.available()) return;
    try {
      const r = await api.conv.meta.get(conversationId);
      if (r && r.success) state.mediaModels = { ...((r.meta && r.meta.data && r.meta.data[MediaModelChoice.META_KEY]) || {}) };
    } catch (_) {}
  }

  async render(holder, binding = this._conversationBinding()) {
    if (!this.available()) return;
    const engine = await this._loadEngine();
    if (!engine) return;
    const jobs = MediaModelChoice.JOBS.filter((spec) => !Array.isArray(binding.jobs) || binding.jobs.includes(spec.job));
    const rows = jobs.map((spec) => this._row(spec, engine, binding)).filter(Boolean);
    if (!rows.length) return;
    holder.appendChild(Dom.el('div', 'cm-gear-sec', 'Media models <span class="cm-gear-sub">for this chat</span>'));
    for (const row of rows) holder.appendChild(row);
  }

  _conversationBinding() {
    return { picks: () => this._ctx.state.mediaModels || {}, pick: (job, id) => this._pick(job, id) };
  }

  async _loadEngine() {
    const image = this._ctx.api.image;
    try {
      const [enabled, defaults, view] = await Promise.all([image.getEnabled(), image.getDefaults(), image.getModelsView()]);
      if (enabled !== true || !defaults || !defaults.runtimeId) return null;
      const models = (view && view.scan && view.scan.models) || [];
      return { defaults, groups: ImageDefaultsMarkup.modelGroups(models), remote: await this._remoteServers() };
    } catch (_) {
      return null;
    }
  }

  async _remoteServers() {
    const image = this._ctx.api.image;
    const remote = {};
    if (typeof image.getServerConfigs !== 'function') return remote;
    try {
      const configs = await image.getServerConfigs();
      for (const [role, id] of Object.entries((configs && configs.active) || {})) {
        const server = ((configs && configs.servers) || []).find((s) => s && s.id === id);
        if (server && server.location === 'remote') remote[role] = server.name || 'a paired computer';
      }
    } catch (_) {}
    return remote;
  }

  _row(spec, engine, binding) {
    const remoteName = engine.remote[spec.role];
    const models = engine.groups[spec.group] || [];
    if (!remoteName && !models.length) return null;
    const row = Dom.el('label', 'cm-gear-field');
    row.appendChild(Dom.el('span', null, spec.label));
    const select = remoteName ? MediaModelChoice._remoteSelect(remoteName) : MediaModelChoice._select(spec, models, engine.defaults, binding);
    row.title = remoteName ? 'Runs on ' + remoteName + ', which chooses the model.' : spec.hint;
    row.appendChild(select);
    return row;
  }

  static _select(spec, models, defaults, binding) {
    const select = document.createElement('select');
    select.dataset.mediaJob = spec.job;
    const current = models.find((m) => m.id === defaults[spec.field]);
    select.appendChild(MediaModelChoice._option('', 'Default (' + (current ? MediaModelChoice._name(current) : spec.noDefault) + ')'));
    for (const m of models) select.appendChild(MediaModelChoice._option(m.id, MediaModelChoice._name(m)));
    const picked = (binding.picks() || {})[spec.job];
    select.value = models.some((m) => m.id === picked) ? picked : '';
    select.addEventListener('change', () => binding.pick(spec.job, select.value));
    return select;
  }

  static _remoteSelect(remoteName) {
    const select = document.createElement('select');
    select.disabled = true;
    select.appendChild(MediaModelChoice._option('', remoteName));
    return select;
  }

  static _option(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
  }

  static _name(model) {
    return model.displayName || model.label || model.id;
  }

  _pick(job, id) {
    const { state } = this._ctx;
    const next = { ...(state.mediaModels || {}) };
    if (id) next[job] = id;
    else delete next[job];
    state.mediaModels = next;
    this._persist();
  }

  async _persist() {
    const { state, api } = this._ctx;
    const id = state.activeId;
    if (!id) return;
    try {
      const r = await api.conv.meta.get(id);
      const data = (r && r.success && r.meta && r.meta.data) || {};
      await api.conv.meta.set(id, { data: { ...data, [MediaModelChoice.META_KEY]: state.mediaModels } });
    } catch (_) {}
  }
}
