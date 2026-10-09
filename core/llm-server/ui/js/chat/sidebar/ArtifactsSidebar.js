import ChatModals from '../common/ChatModals.js';
import ArtifactRowHtml from './ArtifactRowHtml.js';

export default class ArtifactsSidebar {
  constructor(ctx) {
    this._ctx = ctx;
    this._rows = [];
  }

  applyMode() {
    const { els, state } = this._ctx;
    const arts = state.sideMode === 'artifacts' || state.sideMode === 'all-artifacts';
    if (els.chatsList) els.chatsList.style.display = arts ? 'none' : '';
    if (els.artsList) els.artsList.style.display = arts ? '' : 'none';
  }

  async toggleScoped() {
    const { state } = this._ctx;
    if (!state.activeId) return;
    if (state.sideMode === 'artifacts') { this.returnToChats(); return; }
    await this._enter('artifacts', () => this.renderScoped());
  }

  async toggleAll() {
    if (this._ctx.state.sideMode === 'all-artifacts') { this.returnToChats(); return; }
    await this._enter('all-artifacts', () => this.renderAll());
  }

  returnToChats() {
    this._ctx.state.sideMode = 'chats';
    this.applyButtons();
    this._ctx.convList.render(this._ctx.state.conversations);
  }

  applyButtons() {
    const { els, state } = this._ctx;
    if (els.artifactsBtn) els.artifactsBtn.classList.toggle('active', state.sideMode === 'artifacts');
    const allBtn = els.sidebar && els.sidebar.querySelector('[data-act="allArts"]');
    if (allBtn) allBtn.classList.toggle('active', state.sideMode === 'all-artifacts');
  }

  repaintIfShowing() {
    const mode = this._ctx.state.sideMode;
    if (mode === 'artifacts') this.renderScoped();
    else if (mode === 'all-artifacts') this.renderAll();
  }

  async refreshTopbarCount() {
    const { els, state, api } = this._ctx;
    const btn = els.artifactsBtn;
    if (!btn) return;
    const countEl = btn.querySelector('[data-cm-art-count]');
    if (!state.activeId) {
      if (countEl) countEl.textContent = '';
      btn.style.display = 'none';
      return;
    }
    const n = (await this._fetch(() => api.conv.artifacts(state.activeId))).length;
    if (countEl) countEl.textContent = n > 0 ? String(n) : '';
    btn.style.display = n > 0 ? '' : 'none';
    if (n === 0 && state.sideMode === 'artifacts') this.returnToChats();
  }

  async renderScoped() {
    const { els, state, api } = this._ctx;
    this.applyMode();
    if (!state.activeId) {
      els.artsList.innerHTML = '<div class="cm-empty">Open a conversation to manage its artifacts.</div>';
      return;
    }
    const conv = state.conversations.find((c) => c.id === state.activeId);
    const convTitle = (conv && conv.title) || 'this conversation';
    this._rows = await this._fetch(() => api.conv.artifacts(state.activeId));
    const head = ArtifactRowHtml.scopeHead('Artifacts in', convTitle, this._rows.length, '', true);
    els.artsList.innerHTML = head + (this._rows.length
      ? this._rows.map((a) => ArtifactRowHtml.row(a)).join('')
      : '<div class="cm-empty">No artifacts have been created in this conversation yet.</div>');
  }

  async renderAll() {
    const { els, api } = this._ctx;
    this.applyMode();
    this._rows = await this._fetch(() => api.artifact.listAll());
    const totalBytes = this._rows.reduce((s, a) => s + (a.bytes || 0), 0);
    const extra = totalBytes ? ' &middot; ' + ArtifactRowHtml.bytes(totalBytes) : '';
    const head = ArtifactRowHtml.scopeHead('All artifacts', 'Everything saved on this device', this._rows.length, extra, false);
    els.artsList.innerHTML = head + (this._rows.length
      ? this._rows.map((a) => ArtifactRowHtml.row(a, { global: true })).join('')
      : '<div class="cm-empty">No artifacts saved yet.</div>');
  }

  async onClick(e) {
    const convBtn = e.target.closest('[data-art-conv]');
    if (convBtn) { e.stopPropagation(); this.returnToChats(); this._ctx.conversation.open(convBtn.dataset.artConv); return; }
    const histBtn = e.target.closest('[data-art-hist]');
    if (histBtn) { e.stopPropagation(); await this._toggleHistory(histBtn); return; }
    const verRow = e.target.closest('.cm-art-ver[data-ver-id]');
    if (verRow && verRow.dataset.verId) { e.stopPropagation(); this._openVersion(verRow.dataset); return; }
    const row = e.target.closest('.cm-conv[data-art-id]');
    const a = row && this._rows.find((x) => String(x.id) === row.dataset.artId);
    if (!a) return;
    if (e.target.closest('[data-art-del]')) { e.stopPropagation(); this._confirmDelete(a); return; }
    this._ctx.panel.open(a);
  }

  async _enter(mode, render) {
    this._ctx.sidebar.expand();
    this._ctx.state.sideMode = mode;
    this.applyButtons();
    await render();
  }

  async _fetch(call) {
    try {
      const r = await call();
      return (r && r.success && Array.isArray(r.artifacts)) ? r.artifacts : [];
    } catch (_) {
      return [];
    }
  }

  async _toggleHistory(histBtn) {
    const row = histBtn.closest('.cm-conv[data-art-id]');
    const rootId = row && row.dataset.artRoot;
    const box = rootId && this._ctx.els.artsList.querySelector('.cm-art-versions[data-art-versions-for="' + rootId + '"]');
    if (!box) return;
    if (!box.hasAttribute('hidden')) {
      box.setAttribute('hidden', '');
      histBtn.classList.remove('open');
      return;
    }
    if (!box.dataset.loaded) await this._loadVersions(box, rootId);
    box.removeAttribute('hidden');
    histBtn.classList.add('open');
  }

  async _loadVersions(box, rootId) {
    box.innerHTML = '<div class="cm-art-ver cm-art-ver-msg">Loading…</div>';
    let vers = [];
    try {
      const r = await this._ctx.api.artifact.versions(rootId);
      vers = (r && r.success && r.versions) || [];
    } catch (_) {}
    box.innerHTML = ArtifactRowHtml.versions(vers);
    box.dataset.loaded = '1';
  }

  _openVersion(d) {
    this._ctx.panel.open({
      id: d.verId,
      type: d.verType || 'html',
      url: d.verUrl || null,
      title: d.verTitle || 'Artifact',
      language: d.verLang || null,
    });
  }

  async _confirmDelete(a) {
    const vc = a.versionCount || 1;
    const name = a.title || 'Artifact';
    const message = vc > 1
      ? 'Delete artifact "' + name + '" and all ' + vc + ' versions? This cannot be undone.'
      : 'Delete artifact "' + name + '"? This cannot be undone.';
    const ok = await ChatModals.confirm(this._ctx.root, message, { danger: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try { await this._ctx.api.artifact.deleteRoot(a.rootId || a.id); } catch (_) {}
    const panel = this._ctx.state.panel;
    if (panel && panel.id === a.id) this._ctx.panel.close();
    if (this._ctx.state.sideMode === 'all-artifacts') await this.renderAll();
    else await this.renderScoped();
    this.refreshTopbarCount();
  }
}
