import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import CopyButton from '../CopyButton.js';
import ProviderCardShell from './ProviderCardShell.js';

export default class ManagedProviderCard {
  static build(config, ctx = null) {
    const card = ProviderCardShell.build(ManagedProviderCard.parts(config));
    card.querySelectorAll('.provider-copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => ManagedProviderCard._copy(btn));
    });
    const select = card.querySelector('[data-field="selectedModel"]');
    if (select && ctx) select.addEventListener('change', () => ManagedProviderCard._pickModel(config, select.value, ctx));
    else if (select) select.disabled = true;
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
            Your local model server. The model picked here is the one it loads next, for the chat and for anything
            set to use the local server; runtimes and launch settings are set up in the LLM tab.
          </div>
          ${ManagedProviderCard._valueGroup('Endpoint', config.endpoint, 'Copy endpoint')}
          ${ManagedProviderCard._modelGroup(config)}
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

  static _modelGroup(config) {
    const esc = HtmlEscaper.escape;
    const models = Array.isArray(config.models) && config.models.length
      ? config.models
      : (config.selectedModel ? [{ id: config.selectedModel }] : []);
    if (!models.length) return ManagedProviderCard._valueGroup('Model', '', 'Copy model');
    const options = models.map((m) => `<option value="${esc(m.id)}"${m.id === config.selectedModel ? ' selected' : ''}>${esc(m.luma_label || m.id)}</option>`).join('');
    return `<div class="form-group">
            <label class="form-label">Model</label>
            <select class="form-select" data-field="selectedModel" aria-label="Local model">${options}</select>
          </div>`;
  }

  static async _pickModel(config, model, ctx) {
    config.selectedModel = model;
    try {
      const saved = await ctx.list.save();
      if (saved && saved.success === false) throw new Error(saved.error || 'save failed');
      ctx.log.add(`Local model set to ${ManagedProviderCard._labelOf(config, model)}`, 'success');
      ctx.pingChat();
    } catch (e) {
      ctx.log.add(`Could not change the local model: ${e.message}`, 'error');
    }
    await ctx.list.render();
  }

  static _labelOf(config, modelId) {
    const hit = (config.models || []).find((m) => m.id === modelId);
    return (hit && hit.luma_label) || modelId;
  }

  static _copy(btn) {
    const value = btn.parentElement.querySelector('.provider-managed-value')?.textContent || '';
    if (!value || value === 'not set') return;
    CopyButton.copy(btn, value);
  }
}
