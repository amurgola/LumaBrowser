import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import CopyButton from '../CopyButton.js';
import ProviderCardShell from './ProviderCardShell.js';

export default class ManagedProviderCard {
  static build(config) {
    const card = ProviderCardShell.build(ManagedProviderCard.parts(config));
    card.querySelectorAll('.provider-copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => ManagedProviderCard._copy(btn));
    });
    return card;
  }

  static html(config) {
    return ProviderCardShell.html(ManagedProviderCard.parts(config));
  }

  static parts(config) {
    const esc = HtmlEscaper.escape;
    return {
      name: config.name || 'Local LLM Server',
      meta: config.selectedModel || 'No model selected',
      status: 'Auto-managed',
      ok: true,
      bodyHtml: `
          <div class="form-help">
            Your local model server. It always uses the runtime and model chosen in the LLM tab, so change them there.
          </div>
          ${ManagedProviderCard._valueGroup('Endpoint', config.endpoint, 'Copy endpoint')}
          ${ManagedProviderCard._valueGroup('Model', config.selectedModel, 'Copy model')}
          ${config.managedRuntimeId ? `<div class="form-help provider-runtime-id">Runtime: <code>${esc(config.managedRuntimeId)}</code></div>` : ''}
        `,
    };
  }

  static _valueGroup(label, value, copyTitle) {
    return `<div class="form-group">
            <label class="form-label">${label}</label>
            <div class="gs-inline-controls">
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
