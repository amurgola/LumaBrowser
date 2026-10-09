import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import CopyButton from '../CopyButton.js';

export default class ManagedProviderCard {
  static build(config) {
    const card = document.createElement('div');
    card.className = 'provider-card';
    card.innerHTML = ManagedProviderCard.html(config);
    card.querySelectorAll('.provider-copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => ManagedProviderCard._copy(btn));
    });
    return card;
  }

  static html(config) {
    const esc = HtmlEscaper.escape;
    return `
        <div class="provider-card-header">
          <span class="provider-card-name">${esc(config.name || 'Local LLM Server')}</span>
          <span class="provider-card-status configured">Auto-managed</span>
        </div>
        <div class="provider-card-body">
          <div class="form-help">
            Your local model server. It always uses the runtime and model chosen in the LLM tab, so change them there.
          </div>
          ${ManagedProviderCard._valueGroup('Endpoint', config.endpoint, 'Copy endpoint')}
          ${ManagedProviderCard._valueGroup('Model', config.selectedModel, 'Copy model')}
          ${config.managedRuntimeId ? `<div class="form-help" style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">runtime: ${esc(config.managedRuntimeId)}</div>` : ''}
        </div>
      `;
  }

  static _valueGroup(label, value, copyTitle) {
    return `<div class="form-group">
            <label class="form-label">${label}</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <span class="gs-url-display provider-managed-value">${value ? HtmlEscaper.escape(value) : 'not set'}</span>
              <button class="gs-copy-btn provider-copy-btn" title="${copyTitle}"${value ? '' : ' disabled'}>Copy</button>
            </div>
          </div>`;
  }

  static _copy(btn) {
    const value = btn.parentElement.querySelector('.provider-managed-value')?.textContent || '';
    if (!value || value === 'not set') return;
    CopyButton.copy(btn, value);
  }
}
