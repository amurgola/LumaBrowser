(function () {
  'use strict';

  class RoleplayRenderer {
    constructor() {
      this.ipc = null;
      this.settingsContainer = null;
    }

    async activate(context) {
      this.ipc = context.ipcBridge;
      this.settingsContainer = context.containers && context.containers.settingsContainer;
      if (context.slotManager && typeof context.slotManager.setCallback === 'function') {
        context.slotManager.setCallback('settings-tab', 'roleplay-mode', 'onActivate', () => this._load());
      }
      this._bind();
      this._load();
    }

    _q(id) {
      return this.settingsContainer
        ? this.settingsContainer.querySelector('#' + id)
        : document.getElementById(id);
    }

    _setNote(on) {
      const note = this._q('ext-rp-labNote');
      if (note) note.style.display = on ? '' : 'none';
    }

    _bind() {
      const cb = this._q('ext-rp-labEnabled');
      if (!cb || cb._wired) return;
      cb._wired = true;
      cb.addEventListener('change', async () => {
        try { await this.ipc.invoke('ext.roleplay-mode.setLabFlag', cb.checked); }
        catch (e) { console.error('roleplay: setLabFlag failed', e); }
        this._setNote(cb.checked);
      });
    }

    async _load() {
      const cb = this._q('ext-rp-labEnabled');
      if (!cb || !this.ipc) return;
      try {
        const r = await this.ipc.invoke('ext.roleplay-mode.getLabFlag');
        cb.checked = !!(r && r.enabled);
        this._setNote(cb.checked);
      } catch (_) {}
    }
  }

  const instance = new RoleplayRenderer();
  window.__ext_roleplay_mode = { activate: (context) => instance.activate(context) };
})();
