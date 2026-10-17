import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ManifestCopy from './ManifestCopy.js';

export default class ExtensionConfigHeader {
  static build(view, actions) {
    const header = document.createElement('div');
    header.className = 'ext-config-header';
    header.innerHTML = ExtensionConfigHeader._html(view);
    header.querySelector('.ext-config-back-btn').addEventListener('click', () => actions.onBack());
    header.querySelector('.ext-edit-code-btn').addEventListener('click', () => actions.onEdit());
    header.querySelector('.ext-export-zip-btn').addEventListener('click', () => actions.onExport());
    return header;
  }

  static _html(view) {
    const esc = HtmlEscaper.escape;
    return `
      <div class="ext-config-header-top">
        <button class="ext-config-back-btn">${ManifestCopy.BACK_ICON} Back to Extensions</button>
        <div class="ext-config-header-info">
          <span class="ext-config-title">${view.titleHtml}</span>
          ${view.description ? `<span class="ext-config-desc">${esc(ManifestCopy.clean(view.description))}</span>` : ''}
        </div>
        <div class="ext-config-actions">
          <button class="btn btn-secondary btn-sm ext-export-zip-btn">Export .zip</button>
          <button class="btn btn-secondary btn-sm ext-edit-code-btn">Edit code</button>
        </div>
      </div>
      ${ExtensionConfigHeader._depsHtml(view.dependencies || [])}
    `;
  }

  static _depsHtml(deps) {
    if (deps.length === 0) return '';
    const rows = deps.map((d) => {
      const cls = d.installed ? 'ext-dep--installed' : 'ext-dep--missing';
      return `<div class="ext-dep ${cls}">
            <span class="ext-dep-name">${HtmlEscaper.escape(d.name)}</span>
            <span class="ext-dep-type">${d.isCore ? 'Core' : 'Extension'}</span>
            <span class="ext-dep-status">${d.installed ? 'Installed' : 'Missing'}</span>
            ${!d.isRequired ? '<span class="ext-dep-optional">Optional</span>' : ''}
          </div>`;
    }).join('');
    return `
      <div class="ext-config-deps">
        <div class="ext-config-deps-label">Depends on</div>
        ${rows}
      </div>
    `;
  }
}
