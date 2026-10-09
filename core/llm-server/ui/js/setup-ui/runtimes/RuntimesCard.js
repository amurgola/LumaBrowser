import HtmlEscaper from '../../format/HtmlEscaper.js';
import FoldMemory from '../../setup/FoldMemory.js';
import RuntimeRowHtml from './RuntimeRowHtml.js';
import RuntimeUpdateBadge from './RuntimeUpdateBadge.js';
import RuntimeRowProgress from './RuntimeRowProgress.js';

export default class RuntimesCard {
  constructor(ctx) {
    this._ctx = ctx;
    this._progress = new RuntimeRowProgress(ctx.doc);
  }

  async render() {
    const api = this._ctx.api;
    if (!api || !api.getRuntimesView) { this._error('llmDiagAPI.getRuntimesView is unavailable.'); return; }
    const res = await api.getRuntimesView();
    if (!res || !res.success) { this._error((res && res.error) || 'Failed to load runtimes'); return; }
    this.renderView(res.view);
    this._ctx.cards.models.render();
    this.refreshUpdates();
  }

  renderView(view) {
    const doc = this._ctx.doc;
    this._ctx.runtimes.setView(view);
    const pill = doc.getElementById('runtimesPill');
    pill.className = 'luma-badge accent';
    pill.textContent = RuntimesCard.pillText(view);
    const body = doc.getElementById('runtimesBody');
    body.className = '';
    body.innerHTML = RuntimesCard.bodyHtml(view);
    for (const r of view.runtimes) this._applyUpdate(r.id);
  }

  async refreshUpdates() {
    const api = this._ctx.api;
    if (!api || !api.checkRuntimeUpdates) return;
    let res;
    try { res = await api.checkRuntimeUpdates(); } catch (_) { return; }
    if (!res || !res.success || !res.updates) return;
    for (const [id, info] of Object.entries(res.updates)) {
      this._ctx.runtimes.setUpdate(id, info);
      this._applyUpdate(id);
    }
  }

  static pillText(view) {
    const inference = view.runtimes.filter((r) => r.kind === 'inference');
    return `${inference.filter((r) => r.installed).length}/${inference.length} installed`;
  }

  static bodyHtml(view) {
    const installed = view.runtimes.filter((r) => r.installed);
    const catalogue = view.runtimes.filter((r) => !r.installed);
    const installedHtml = installed.length
      ? installed.map(RuntimeRowHtml.html).join('')
      : '<div class="luma-empty">No runtime installed yet. Pick one from the catalogue below.</div>';
    return installedHtml + `
                <details class="setup-fold" data-fold-key="llm.runtimeCatalogue" ${FoldMemory.attr('llm.runtimeCatalogue', installed.length === 0)}>
                    <summary><span class="setup-fold-title">Catalogue</span><span class="setup-fold-meta"><span class="fold-chip">${catalogue.length} available</span></span></summary>
                    <div class="setup-fold-body">
                        ${catalogue.map(RuntimeRowHtml.html).join('')}
                        ${RuntimesCard.sourceCallout(view)}
                    </div>
                </details>`;
  }

  static sourceCallout(view) {
    const esc = HtmlEscaper.escape;
    const links = RuntimesCard._repoLinks(view.runtimes);
    return `
                <details class="source-callout">
                    <summary>Where these come from</summary>
                    Auto-installed runtimes are the
                    official prebuilt binaries fetched directly from each project's GitHub
                    Releases: no third-party mirror, and nothing is uploaded from your machine.
                    <ul>
                        <li>The latest stable release is resolved via the GitHub API, then the
                            release asset matching your platform (<code>${esc(view.platformKey)}</code>)
                            is downloaded straight from GitHub. CUDA builds also pull the official
                            <code>cudart</code> companion archive from the same release.</li>
                        <li>Each file's <strong>SHA-256</strong> is computed on download and recorded
                            in <code>manifest.json</code> next to the binary.</li>
                        <li>Everything is extracted locally under
                            <code>${esc(view.runtimesRoot)}</code>; <em>Remove</em> deletes that folder.</li>
                    </ul>
                    ${links.length ? `<div style="margin-top:6px;">Upstream: ${links.join(' · ')}</div>` : ''}
                </details>
            `;
  }

  static _repoLinks(runtimes) {
    const esc = HtmlEscaper.escape;
    const seen = new Set();
    const links = [];
    for (const r of runtimes) {
      if (!r.repo || !r.repo.owner || !r.repo.repo) continue;
      const slug = `${r.repo.owner}/${r.repo.repo}`;
      if (seen.has(slug)) continue;
      seen.add(slug);
      links.push(`<button class="src-link" data-runtime-action="open-external" `
        + `data-runtime-url="https://github.com/${esc(slug)}/releases">`
        + `github.com/${esc(slug)} ↗</button>`);
    }
    return links;
  }

  _applyUpdate(id) {
    const info = this._ctx.runtimes.update(id);
    if (info) RuntimeUpdateBadge.apply(this._progress.row(id), info, this._ctx.doc);
  }

  _error(text) {
    const body = this._ctx.doc.getElementById('runtimesBody');
    body.className = 'luma-error';
    body.textContent = text;
  }
}
