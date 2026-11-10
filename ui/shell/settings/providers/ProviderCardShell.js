import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class ProviderCardShell {
  static CHEVRON = '<svg class="gs-chevron" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4 2.5l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  static html({ name, meta = '', status = '', ok = true, bodyHtml = '' }) {
    const esc = HtmlEscaper.escape;
    return `
        <summary class="provider-card-header">
          ${ProviderCardShell.CHEVRON}
          <span class="provider-card-name">${esc(name)}</span>
          <span class="provider-card-meta" title="${esc(meta)}">${esc(meta)}</span>
          <span class="provider-card-status ${ok ? 'configured' : ''}">${esc(status)}</span>
        </summary>
        <div class="provider-card-body">${bodyHtml}</div>
      `;
  }

  static build(parts) {
    const card = document.createElement('details');
    card.className = 'provider-card';
    card.innerHTML = ProviderCardShell.html(parts);
    return card;
  }
}
