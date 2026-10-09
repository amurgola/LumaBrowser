import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Dialogs from '../../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import DefaultProviderOptions from './DefaultProviderOptions.js';

export default class EditableProviderCard {
  static build(config, ctx) {
    const card = document.createElement('div');
    card.className = 'provider-card';
    card.innerHTML = EditableProviderCard.html(config);
    card.querySelector('.provider-fetch-btn').addEventListener('click', () => EditableProviderCard._fetchModels(card, config, ctx));
    card.querySelector('.provider-save-btn').addEventListener('click', () => EditableProviderCard._save(card, config, ctx));
    card.querySelector('.provider-delete-btn').addEventListener('click', () => EditableProviderCard._remove(config, ctx));
    return card;
  }

  static statusText(config) {
    if (config.endpoint && config.selectedModel) return 'Configured';
    return config.endpoint ? 'Endpoint set' : 'Not configured';
  }

  static modelOptions(models, selected) {
    const esc = HtmlEscaper.escape;
    return '<option value="">Select a model...</option>'
      + (models || []).map((m) => `<option value="${esc(m.id)}" ${m.id === selected ? 'selected' : ''}>${esc(m.id)}</option>`).join('');
  }

  static html(config) {
    const esc = HtmlEscaper.escape;
    const configured = !!(config.endpoint && config.selectedModel);
    return `
      <div class="provider-card-header">
        <span class="provider-card-name">${esc(config.name || DefaultProviderOptions.TYPE_LABELS[config.type] || config.type)}</span>
        <span class="provider-card-status ${configured ? 'configured' : ''}">${EditableProviderCard.statusText(config)}</span>
      </div>
      <div class="provider-card-body">
        <div class="form-group">
          <label class="form-label">Endpoint</label>
          <div style="display:flex; gap:8px;">
            <input type="text" class="form-input" value="${esc(config.endpoint || '')}" data-field="endpoint" placeholder="${config.type === 'anthropic' ? 'https://api.anthropic.com' : 'http://localhost:1234'}">
            <button class="btn btn-fetch provider-fetch-btn">Fetch Models</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">API Key ${config.type === 'openai' ? '(optional)' : ''}</label>
          <input type="password" class="form-input" value="${esc(config.apiKey || '')}" data-field="apiKey" placeholder="sk-...">
        </div>
        <div class="form-group">
          <label class="form-label">Model</label>
          <select class="form-select provider-model-select" data-field="selectedModel">
            ${EditableProviderCard.modelOptions(config.models, config.selectedModel)}
          </select>
        </div>
        <div class="form-buttons" style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn btn-primary provider-save-btn">Save</button>
          <button class="btn btn-danger provider-delete-btn">Remove</button>
        </div>
      </div>
    `;
  }

  static _field(card, name) {
    return card.querySelector(`[data-field="${name}"]`);
  }

  static async _fetchModels(card, config, ctx) {
    const endpoint = EditableProviderCard._field(card, 'endpoint').value.trim();
    const apiKey = EditableProviderCard._field(card, 'apiKey').value.trim();
    if (!endpoint) return;
    const btn = card.querySelector('.provider-fetch-btn');
    btn.disabled = true;
    btn.textContent = 'Fetching...';
    try {
      const result = await window.ipcBridge.invoke('core.llm.fetchModelsForEndpoint', config.type, endpoint, apiKey);
      if (result.success && result.models) {
        config.models = result.models;
        const select = card.querySelector('.provider-model-select');
        select.innerHTML = EditableProviderCard.modelOptions(result.models, null);
        select.disabled = false;
      } else {
        ctx.feedback.toast('Could not fetch models: ' + (result.error || 'Unknown error'), 'bad');
      }
    } catch (e) {
      ctx.feedback.toast('Could not fetch models: ' + e.message, 'bad');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Fetch Models';
    }
  }

  static async _save(card, config, ctx) {
    config.endpoint = EditableProviderCard._field(card, 'endpoint').value.trim();
    config.apiKey = EditableProviderCard._field(card, 'apiKey').value.trim();
    config.selectedModel = EditableProviderCard._field(card, 'selectedModel').value;
    try {
      await ctx.list.save();
      ctx.feedback.toast(`Provider "${config.name}" saved`, 'ok');
    } catch (e) {
      ctx.feedback.toast(`Could not save "${config.name}": ${e.message}`, 'bad');
      return;
    }
    ctx.pingChat();
    await ctx.list.render();
  }

  static async _remove(config, ctx) {
    if (!(await Dialogs.confirm(`Remove provider "${config.name}"?`, { okLabel: 'Remove', danger: true }))) return;
    await ctx.list.remove(config.id);
    ctx.pingChat();
    await ctx.list.render();
  }
}
