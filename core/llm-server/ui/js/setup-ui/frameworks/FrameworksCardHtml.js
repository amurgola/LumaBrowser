import HtmlEscaper from '../../format/HtmlEscaper.js';
import FoldMemory from '../../setup/FoldMemory.js';
import HostRuntimeAdvice from '../runtimes/HostRuntimeAdvice.js';
import RuntimeRowHtml from '../runtimes/RuntimeRowHtml.js';
import FormatLabels from './FormatLabels.js';
import FrameworkFrameHtml from './FrameworkFrameHtml.js';

export default class FrameworksCardHtml {
  static INFERENCE_KIND = 'inference';

  static body(view, frameworks, context) {
    const groups = FrameworksCardHtml.groups(view.runtimes);
    const installed = groups.filter(FrameworksCardHtml.isInstalled);
    const current = frameworks.current();
    const frameContext = { ...context, currentFrameworkId: current && current.runtimeId ? current.frameworkId : null };
    const frames = installed.length
      ? installed.map((group) => FrameworkFrameHtml.html(group, frameworks.get(group.id), frameContext)).join('')
      : '<div class="luma-empty">No framework installed yet. Pick one from the catalogue below.</div>';
    return FrameworksCardHtml.formatRows(frameworks, context.rows)
      + frames
      + FrameworksCardHtml.catalogue(groups.filter((group) => !FrameworksCardHtml.isInstalled(group)), view, frameworks, context.advice, installed.length === 0);
  }

  static groups(runtimes) {
    const byId = new Map();
    for (const row of (runtimes || []).filter((r) => (r.kind || FrameworksCardHtml.INFERENCE_KIND) === FrameworksCardHtml.INFERENCE_KIND)) {
      const id = row.framework || row.id;
      if (!byId.has(id)) byId.set(id, { id, name: row.frameworkName || row.name || id, rows: [] });
      byId.get(id).rows.push(row);
    }
    return [...byId.values()];
  }

  static isInstalled(group) {
    return group.rows.some((row) => row.installed);
  }

  static pillText(view) {
    const groups = FrameworksCardHtml.groups(view.runtimes);
    return `${groups.filter(FrameworksCardHtml.isInstalled).length} of ${groups.length} installed`;
  }

  static formatRows(frameworks, rows) {
    const esc = HtmlEscaper.escape;
    const formats = ((frameworks.view && frameworks.view.formats) || []).filter((format) => format.needsChoice);
    if (!formats.length) return '';
    return `<div class="fw-formats">${formats.map((format) => {
      const options = format.frameworkIds.map((id) => `<option value="${esc(id)}" ${id === format.defaultFrameworkId ? 'selected' : ''}>${esc(frameworks.nameOf(id))}</option>`).join('');
      return rows.select(`fwFormat-${esc(format.id)}`, `${esc(FormatLabels.noun(format.id))} run on`, options, '', `data-format-framework="${esc(format.id)}"`);
    }).join('')}</div>`;
  }

  static catalogue(groups, view, frameworks, advice = {}, openByDefault = false) {
    if (!groups.length) return FrameworksCardHtml.sourceCallout(view);
    const count = `${groups.length} ${groups.length === 1 ? 'framework' : 'frameworks'}`;
    return `
                <details class="setup-fold" data-fold-key="llm.runtimeCatalogue" ${FoldMemory.attr('llm.runtimeCatalogue', openByDefault)}>
                    <summary><span class="setup-fold-title">Catalogue</span><span class="setup-fold-meta"><span class="fold-chip">${count}</span></span></summary>
                    <div class="setup-fold-body">
                        ${groups.map((group) => FrameworksCardHtml._catalogueGroup(group, frameworks.get(group.id), advice)).join('')}
                        ${FrameworksCardHtml.sourceCallout(view)}
                    </div>
                </details>`;
  }

  static _catalogueGroup(group, framework, advice) {
    const esc = HtmlEscaper.escape;
    const loads = FormatLabels.loadsText(framework ? framework.formats : []);
    const rows = HostRuntimeAdvice.sortRows(group.rows, advice).map((row) => RuntimeRowHtml.html(row, advice[row.id] || null)).join('');
    return `<div class="fw-catalogue-group" data-catalogue-framework="${esc(group.id)}">`
      + `<div class="fw-head"><span class="fw-name">${esc((framework && framework.name) || group.name)}</span>${loads ? `<span class="fw-loads">${esc(loads)}</span>` : ''}</div>`
      + `${rows}</div>`;
  }

  static sourceCallout(view) {
    const esc = HtmlEscaper.escape;
    const links = FrameworksCardHtml._repoLinks(view.runtimes || []);
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
}
