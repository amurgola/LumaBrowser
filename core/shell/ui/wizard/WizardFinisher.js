import WizardApis from './WizardApis.js';
import WizardLanding from './WizardLanding.js';
import WorkflowPresets from './WorkflowPresets.js';

export default class WizardFinisher {
  static MANAGED_PROVIDER = 'core.llmServer.local';

  static CLOSE_DELAY_MS = 550;

  constructor(wizard) {
    this._w = wizard;
  }

  async finish() {
    this._lock();
    this._status('info', 'Saving configuration…');
    try {
      await this._apply();
      this._status('ok', 'All set. Launching LumaBrowser…');
      setTimeout(() => this._w.teardown(), WizardFinisher.CLOSE_DELAY_MS);
    } catch (err) {
      console.error('SetupWizard: finalize failed:', err);
      this._status('err', `Setup hit an error: ${err.message || err}. You can retry or close the wizard and finish configuration in Settings.`);
      this._unlock();
    }
  }

  async _apply() {
    const api = window.electronAPI;
    const isFirstRun = !(api && api.getSetupComplete ? await api.getSetupComplete().catch(() => null) : null);
    if (isFirstRun) await this._applyDisabledSet();
    else await this._applyToggles();
    await this._applyRemoteLlm();
    await this._applyWebhook(isFirstRun);
    await this._applyAutoUpdate();
    const hasLlm = this._hasLlm();
    await this._markComplete(hasLlm);
    if (this._w.state.llm.mode === 'local' && this._w.state.llm.local.done) await this._seedLocalSlots();
    await this._land(hasLlm);
  }

  _lock() {
    const w = this._w;
    w.backBtn.disabled = true;
    w.nextBtn.disabled = true;
    if (w.skipBtn) w.skipBtn.disabled = true;
    w.nextBtn.textContent = 'Applying…';
  }

  _unlock() {
    const w = this._w;
    w.backBtn.disabled = false;
    w.nextBtn.disabled = false;
    if (w.skipBtn) w.skipBtn.disabled = false;
    w.nextBtn.textContent = 'Retry';
  }

  _status(variant, text) {
    const statusEl = this._w.bodyEl.querySelector('#setupDoneStatus');
    if (statusEl) {
      statusEl.className = `setup-wizard__status setup-wizard__status--${variant}`;
      statusEl.textContent = text;
    } else if (this._w.progressEl) {
      this._w.progressEl.textContent = text;
    }
  }

  async _applyDisabledSet() {
    if (!window.electronAPI || !window.electronAPI.setDisabledExtensions) return;
    await this._extensionsLoaded();
    const known = new Set(this._w.extensions.map((e) => e.id));
    const disabled = [...this._w.state.extensionOverrides].filter(([id, enabled]) => !enabled && known.has(id)).map(([id]) => id);
    await window.electronAPI.setDisabledExtensions(disabled);
  }

  async _applyToggles() {
    if (!window.ipcBridge) return;
    await this._extensionsLoaded();
    for (const ext of this._w.extensions) {
      const desired = this._w.state.extensionOverrides.get(ext.id) === true;
      if (desired === (ext.enabled !== false)) continue;
      try {
        await WizardApis.invoke('core.shell.toggleExtension', ext.id, desired);
      } catch (err) {
        console.warn(`SetupWizard: failed to toggle ${ext.id}:`, err.message);
      }
    }
  }

  async _extensionsLoaded() {
    try { await this._w.extensionsReady; } catch (_) {}
  }

  async _applyRemoteLlm() {
    const llm = this._w.state.llm;
    if (!WorkflowPresets.needsLlm(this._w.enabledExtensions())) return;
    if (llm.mode === 'local' || !llm.apiKey || !llm.selectedModel) return;
    if (!window.ipcBridge || !window.ipcBridge.saveProviderConfigs) return;
    const existing = (await window.ipcBridge.getProviderConfigs().catch(() => [])) || [];
    await window.ipcBridge.saveProviderConfigs([...existing.filter((c) => c.type !== llm.type), WizardFinisher._providerEntry(llm)]);
    await this._seedSlots(llm.type, llm.selectedModel, false);
  }

  static _providerEntry(llm) {
    return {
      type: llm.type,
      name: llm.type === 'anthropic' ? 'Anthropic' : 'OpenAI-Compatible',
      endpoint: llm.endpoint,
      apiKey: llm.apiKey,
      models: llm.models,
      selectedModel: llm.selectedModel,
    };
  }

  async _seedLocalSlots() {
    const model = this._w.state.llm.local.modelName;
    if (model) await this._seedSlots(WizardFinisher.MANAGED_PROVIDER, model, true);
  }

  async _seedSlots(provider, model, local) {
    const slotApi = window.llmSlotAPI;
    if (!(slotApi && slotApi.getAllSlots && slotApi.setSlotConfig)) return;
    try {
      const slots = await slotApi.getAllSlots();
      if (!slots || !slots.length) { WizardFinisher._warnNoSlots(local); return; }
      for (const slot of slots) {
        if (!slot.provider) await slotApi.setSlotConfig(slot.slotId, provider, model);
      }
    } catch (err) {
      console.warn(local ? 'SetupWizard: failed to seed local LLM slots:' : 'SetupWizard: failed to seed LLM slots:', err.message);
    }
  }

  static _warnNoSlots(local) {
    console.warn(local
      ? 'SetupWizard: no LLM slots registered after activation; local model will not be routed to any slot. Did setSetupComplete stop awaiting startDeferredServices?'
      : 'SetupWizard: no LLM slots registered yet; relying on the legacy provider fallback for remote mode.');
  }

  async _applyWebhook(isFirstRun) {
    const url = this._w.state.webhookUrl;
    const api = window.electronAPI;
    if (!this._w.enabledExtensions().includes('notification-interceptor') || !url || !api) return;
    try {
      if (isFirstRun && api.setWebhookUrlDirect) await api.setWebhookUrlDirect(url);
      else if (api.saveWebhookUrl) await api.saveWebhookUrl(url);
    } catch (err) {
      console.warn('SetupWizard: failed to save webhook URL:', err.message);
    }
  }

  async _applyAutoUpdate() {
    const cb = this._w.bodyEl.querySelector('#setupAutoUpdate');
    if (!cb || !window.electronAPI || !window.electronAPI.setAutoCheckUpdates) return;
    try { await window.electronAPI.setAutoCheckUpdates(cb.checked); } catch (_) {}
  }

  _hasLlm() {
    const llm = this._w.state.llm;
    return llm.mode === 'local' ? llm.local.done === true : (!!llm.apiKey && !!llm.selectedModel);
  }

  async _markComplete(hasLlm) {
    if (!window.electronAPI || !window.electronAPI.setSetupComplete) return;
    const s = this._w.state;
    await window.electronAPI.setSetupComplete({
      persona: s.persona,
      workflow: s.workflow,
      enabledExtensions: this._w.enabledExtensions(),
      hasLlm,
      hasWebhook: !!s.webhookUrl,
    });
  }

  async _land(hasLlm) {
    const landing = WizardLanding.call(this._w.state, hasLlm);
    if (!landing) return;
    try { await WizardApis.invoke(...landing); } catch (_) {}
  }
}
