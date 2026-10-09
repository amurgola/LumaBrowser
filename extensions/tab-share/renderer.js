(function () {
  'use strict';

  const EXT_ID = 'tab-share';
  const CH = (name) => `ext.${EXT_ID}.${name}`;
  const STYLE_ID = 'ext-ts-style';
  const FLAG_SVG = '<svg class="tab-flag tab-flag-share" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
  const STYLE = `
.tab-strip .tab .tab-flag-share { display: none; }
.tab-strip .tab.ext-ts-shared .tab-flag-share { display: inline; color: var(--accent); }
.ext-ts-modal { max-width: 520px; width: min(520px, calc(100vw - 32px)); }
.ext-ts-sub { font-size: 12px; color: var(--text-muted, #a8aebd); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: -8px; }
.ext-ts-modes { display: flex; flex-direction: column; gap: 8px; }
.ext-ts-mode { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 10px; cursor: pointer; }
.ext-ts-mode:hover { border-color: var(--accent, #f59034); }
.ext-ts-mode.is-on { border-color: var(--accent, #f59034); background: rgba(245, 144, 52, 0.06); }
.ext-ts-mode input { margin-top: 3px; accent-color: var(--accent, #f59034); }
.ext-ts-mode-name { font-size: 13px; font-weight: 600; }
.ext-ts-mode-help { font-size: 12px; color: var(--text-muted, #a8aebd); line-height: 1.45; margin-top: 2px; }
.ext-ts-linkrow { display: flex; gap: 8px; align-items: center; }
.ext-ts-linkrow .lm-input { flex: 1 1 auto; min-width: 0; font-size: 12px; }
.ext-ts-meta { font-size: 12px; color: var(--text-muted, #a8aebd); display: flex; align-items: center; gap: 8px; }
.ext-ts-meta .luma-dot { flex: 0 0 auto; }
.ext-ts-warn { font-size: 12px; color: var(--warn, #fbbf24); line-height: 1.45; }
.ext-ts-row-title { font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ext-ts-row-url { font-size: 11.5px; color: var(--text-muted, #a8aebd); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ext-ts-row { display: flex; flex-direction: column; gap: 8px; }
.ext-ts-row-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.ext-ts-row-actions .luma-field-select { width: auto; }
`;

  function loadExtUi() {
    if (window.LumaExtUI) return Promise.resolve(window.LumaExtUI);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'extensions/ext-ui.js';
      s.onload = () => resolve(window.LumaExtUI);
      s.onerror = () => reject(new Error('extensions/ext-ui.js failed to load'));
      document.head.appendChild(s);
    });
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const viewersLabel = (n) => (n === 1 ? '1 person watching' : `${n} people watching`);
  const modeLabel = (m) => (m === 'interact' ? 'View and interact' : 'View only');

  class TabShareRenderer {
    constructor() {
      this._active = false;
      this.ipc = null;
      this.ui = null;
      this.status = { available: false, reason: null, shares: [] };
      this._unsubs = [];
      this._unregisterMenu = null;
      this.settingsContainer = null;
      this.dialog = null;
    }

    async activate(context) {
      if (this._active) this.deactivate();
      this._active = true;
      this.ipc = context.ipcBridge;
      this.ui = await loadExtUi().catch(() => null);
      this.settingsContainer = context.containers && context.containers.settingsContainer;

      if (!document.getElementById(STYLE_ID)) {
        const st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = STYLE;
        document.head.appendChild(st);
      }

      this._unsubs.push(this.ipc.on(CH('changed'), (payload) => this._onChanged(payload)));
      this._unsubs.push(this.ipc.on('tab:state', () => this._applyFlags()));

      if (typeof window.registerTabMenuContributor === 'function') {
        this._unregisterMenu = window.registerTabMenuContributor((ctx) => this._contributeMenu(ctx));
      }

      if (context.slotManager && context.slotManager.setCallback) {
        context.slotManager.setCallback('settings-tab', EXT_ID, 'onActivate', () => this.refresh());
      }
      this._bindSettings();
      await this.refresh();
    }

    deactivate() {
      for (const off of this._unsubs) { try { off(); } catch (_) {} }
      this._unsubs = [];
      if (this._unregisterMenu) { try { this._unregisterMenu(); } catch (_) {} this._unregisterMenu = null; }
      this._closeDialog();
      for (const el of document.querySelectorAll('.tab.ext-ts-shared')) el.classList.remove('ext-ts-shared');
      this.settingsContainer = null;
      this._active = false;
    }


    async refresh() {
      try { this.status = await this.ipc.invoke(CH('status')); } catch (_) {}
      this._render();
    }

    _onChanged(payload) {
      if (payload && payload.status) this.status = payload.status;
      this._render();
    }

    _render() {
      this._applyFlags();
      this._renderSettings();
      if (this.dialog) this.dialog.update();
    }

    shareForTab(tabId) {
      return (this.status.shares || []).find((s) => s.tabId === tabId) || null;
    }

    _applyFlags() {
      const shared = new Set((this.status.shares || []).filter((s) => s.live).map((s) => String(s.tabId)));
      for (const el of document.querySelectorAll('.tab-strip .tab[data-tab-id]')) {
        const on = shared.has(el.dataset.tabId);
        if (on && !el.querySelector('.tab-flag-share')) {
          const flags = el.querySelector('.tab-flags');
          if (flags) flags.insertAdjacentHTML('beforeend', FLAG_SVG);
        }
        el.classList.toggle('ext-ts-shared', on);
      }
    }


    async _contributeMenu({ tab, tabId, add }) {
      await this.refresh();
      const share = this.shareForTab(tabId);
      if (share) {
        add('ext-ts-manage', 'Sharing tab', () => this.openDialog(tabId, tab), { check: true, checkLabel: share.viewers ? `${share.viewers} watching` : modeLabel(share.mode) });
        add('ext-ts-stop', 'Stop sharing tab', () => this.stop(share.id));
      } else if (this.status.available) {
        add('ext-ts-share', 'Share tab', () => this.openDialog(tabId, tab));
      }
    }

    async stop(shareId) {
      try { await this.ipc.invoke(CH('stop'), shareId); } catch (_) {}
      await this.refresh();
    }


    openDialog(tabId, tab) {
      this._closeDialog();
      const root = document.createElement('div');
      root.className = 'lm-overlay';
      root.innerHTML = `
        <div class="lm-modal ext-ts-modal" role="dialog" aria-modal="true" aria-labelledby="ext-ts-dlg-title">
          <div class="lm-title" id="ext-ts-dlg-title">Share tab</div>
          <div class="ext-ts-sub" id="ext-ts-dlg-sub"></div>
          <div class="ext-ts-modes" id="ext-ts-dlg-modes">
            <label class="ext-ts-mode" data-mode="view">
              <input type="radio" name="ext-ts-mode" value="view">
              <span><span class="ext-ts-mode-name">View only</span><span class="ext-ts-mode-help">They watch the tab live. Nothing they do reaches the page.</span></span>
            </label>
            <label class="ext-ts-mode" data-mode="interact">
              <input type="radio" name="ext-ts-mode" value="interact">
              <span><span class="ext-ts-mode-name">View and interact</span><span class="ext-ts-mode-help">They can click, scroll and type in the tab, including on sites where you are signed in.</span></span>
            </label>
          </div>
          <div id="ext-ts-dlg-link" hidden>
            <div class="ext-ts-linkrow">
              <input class="lm-input" id="ext-ts-dlg-url" readonly spellcheck="false">
              <button type="button" class="lm-btn is-primary" id="ext-ts-dlg-copy">Copy</button>
            </div>
            <div class="ext-ts-meta ext-mt-8"><span class="luma-dot ok" id="ext-ts-dlg-dot"></span><span id="ext-ts-dlg-viewers"></span></div>
          </div>
          <div class="ext-ts-warn" id="ext-ts-dlg-warn" hidden></div>
          <div class="lm-actions" id="ext-ts-dlg-actions"></div>
        </div>`;
      const q = (sel) => root.querySelector(sel);
      const dlg = { root, tabId, mode: 'view', update: () => this._updateDialog(dlg) };
      this.dialog = dlg;

      q('#ext-ts-dlg-sub').textContent = tab && (tab.title || tab.url) ? `${tab.title || ''}${tab.title && tab.url ? '  ' : ''}${tab.url || ''}` : '';
      q('#ext-ts-dlg-sub').title = tab && tab.url ? tab.url : '';

      q('#ext-ts-dlg-modes').addEventListener('change', async (e) => {
        if (!e.target || e.target.name !== 'ext-ts-mode') return;
        dlg.mode = e.target.value;
        const share = this.shareForTab(tabId);
        if (share && share.mode !== dlg.mode) {
          const r = await this.ipc.invoke(CH('setMode'), share.id, dlg.mode).catch(() => null);
          if (r && !r.success) this._warn(dlg, r.error);
        }
        dlg.update();
      });
      q('#ext-ts-dlg-copy').addEventListener('click', async () => {
        const url = q('#ext-ts-dlg-url').value;
        if (!url) return;
        try { await navigator.clipboard.writeText(url); } catch (_) { q('#ext-ts-dlg-url').select(); document.execCommand && document.execCommand('copy'); }
        const btn = q('#ext-ts-dlg-copy');
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
      root.addEventListener('click', (e) => { if (e.target === root) this._closeDialog(); });
      const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); this._closeDialog(); } };
      document.addEventListener('keydown', onKey);
      dlg.cleanup = () => document.removeEventListener('keydown', onKey);

      const existing = this.shareForTab(tabId);
      dlg.mode = existing ? existing.mode : 'view';
      document.body.appendChild(root);
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-open')));
      dlg.update();
    }

    _updateDialog(dlg) {
      const root = dlg.root;
      const q = (sel) => root.querySelector(sel);
      const share = this.shareForTab(dlg.tabId);
      if (share) dlg.mode = share.mode;
      for (const label of root.querySelectorAll('.ext-ts-mode')) {
        const on = label.dataset.mode === dlg.mode;
        label.classList.toggle('is-on', on);
        label.querySelector('input').checked = on;
      }
      const link = q('#ext-ts-dlg-link');
      const actions = q('#ext-ts-dlg-actions');
      actions.innerHTML = '';
      const btn = (label, cls, fn) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = `lm-btn ${cls || ''}`.trim(); b.textContent = label;
        b.addEventListener('click', fn);
        actions.appendChild(b);
        return b;
      };
      if (share) {
        link.hidden = false;
        q('#ext-ts-dlg-url').value = share.url || '';
        q('#ext-ts-dlg-viewers').textContent = share.live
          ? `${viewersLabel(share.viewers || 0)}${share.videoViewers ? ` (${share.videoViewers} on video)` : ''}. The tab stays shared until you stop it, even if you close it.`
          : 'The tab is not running right now. The link resumes when it is restored.';
        q('#ext-ts-dlg-dot').className = `luma-dot ${share.live ? (share.viewers ? 'ok' : 'warn') : 'bad'}`;
        if (!this.status.available) this._warn(dlg, this.status.reason || 'Sharing is currently unavailable.');
        btn('Stop sharing', 'is-danger', async () => { await this.stop(share.id); this._closeDialog(); });
        btn('Done', 'is-primary', () => this._closeDialog());
      } else {
        link.hidden = true;
        if (!this.status.available) this._warn(dlg, this.status.reason || 'Sharing is currently unavailable.');
        btn('Cancel', '', () => this._closeDialog());
        const create = btn('Create link', 'is-primary', async () => {
          create.disabled = true;
          const r = await this.ipc.invoke(CH('share'), dlg.tabId, dlg.mode).catch((err) => ({ success: false, error: err && err.message }));
          create.disabled = false;
          if (!r || !r.success) { this._warn(dlg, (r && r.error) || 'Could not share this tab.'); return; }
          await this.refresh();
          const urlEl = q('#ext-ts-dlg-url');
          if (urlEl && urlEl.value) { try { urlEl.focus(); urlEl.select(); } catch (_) {} }
        });
        create.disabled = !this.status.available;
      }
    }

    _warn(dlg, text) {
      const el = dlg.root.querySelector('#ext-ts-dlg-warn');
      if (!el) return;
      el.textContent = text || '';
      el.hidden = !text;
    }

    _closeDialog() {
      const dlg = this.dialog;
      if (!dlg) return;
      this.dialog = null;
      if (dlg.cleanup) dlg.cleanup();
      dlg.root.classList.remove('is-open');
      setTimeout(() => { if (dlg.root.parentNode) dlg.root.parentNode.removeChild(dlg.root); }, 120);
    }


    _bindSettings() {
      const root = this.settingsContainer;
      if (!root) return;
      const stopAll = root.querySelector('#ext-ts-stopAll');
      if (stopAll && !stopAll._tsBound) {
        stopAll._tsBound = true;
        stopAll.addEventListener('click', async () => {
          const ok = this.ui ? await this.ui.confirm('Stop sharing every tab? Everyone watching is disconnected.') : window.confirm('Stop sharing every tab?');
          if (!ok) return;
          try { await this.ipc.invoke(CH('stopAll')); } catch (_) {}
          await this.refresh();
        });
      }
      const bindSetting = (id, read, evName = 'change') => {
        const el = root.querySelector(`#${id}`);
        if (!el || el._tsBound) return;
        el._tsBound = true;
        el.addEventListener(evName, async () => {
          let r = null;
          try { r = await this.ipc.invoke(CH('updateSettings'), read(el)); } catch (_) {}
          const row = el.type === 'checkbox' ? el.closest('.luma-check') : null;
          const anchor = row ? (row.querySelector(':scope > span:last-child') || row) : el;
          if (r && r.success && this.ui && this.ui.flashSaved) this.ui.flashSaved(anchor);
          if (r && !r.success && this.ui) this.ui.alert(r.error || 'Could not save.');
          await this.refresh();
        });
      };
      bindSetting('ext-ts-rtcEnabled', (el) => ({ rtcEnabled: !!el.checked }));
      bindSetting('ext-ts-turnEnabled', (el) => ({ turnEnabled: !!el.checked }));
      bindSetting('ext-ts-turnPort', (el) => ({ turnPort: Number(el.value) || 3478 }));
      bindSetting('ext-ts-turnHost', (el) => ({ turnHost: el.value }));
      const list = root.querySelector('#ext-ts-list');
      if (list && !list._tsBound) {
        list._tsBound = true;
        list.addEventListener('click', async (e) => {
          const b = e.target.closest('button[data-act]');
          if (!b) return;
          const id = b.dataset.id;
          if (b.dataset.act === 'stop') { await this.stop(id); return; }
          if (b.dataset.act === 'copy') {
            const share = (this.status.shares || []).find((s) => s.id === id);
            if (!share || !share.url) return;
            try { await navigator.clipboard.writeText(share.url); } catch (_) {}
            b.textContent = 'Copied';
            setTimeout(() => { b.textContent = 'Copy link'; }, 1500);
          }
          if (b.dataset.act === 'show') {
            const share = (this.status.shares || []).find((s) => s.id === id);
            if (share && share.live && window.tabAPI) { try { window.tabAPI.show(share.tabId); } catch (_) {} }
          }
        });
        list.addEventListener('change', async (e) => {
          const sel = e.target.closest('select[data-act="mode"]');
          if (!sel) return;
          try { await this.ipc.invoke(CH('setMode'), sel.dataset.id, sel.value); } catch (_) {}
          if (this.ui && this.ui.flashSaved) this.ui.flashSaved(sel);
          await this.refresh();
        });
      }
    }

    _renderStreamingSettings(root) {
      const s = this.status.settings || {};
      const rtc = this.status.rtc || {};
      const turn = rtc.turn || {};
      const setChecked = (id, v) => { const el = root.querySelector(`#${id}`); if (el && document.activeElement !== el) el.checked = !!v; };
      const setValue = (id, v) => { const el = root.querySelector(`#${id}`); if (el && document.activeElement !== el) el.value = v == null ? '' : String(v); };
      setChecked('ext-ts-rtcEnabled', s.rtcEnabled);
      setChecked('ext-ts-turnEnabled', s.turnEnabled);
      setValue('ext-ts-turnPort', s.turnPort);
      setValue('ext-ts-turnHost', s.turnHost);
      const rtcStatus = root.querySelector('#ext-ts-rtcStatus');
      if (rtcStatus) {
        rtcStatus.textContent = !s.rtcEnabled
          ? 'Off. Guests use the frame-by-frame picture.'
          : rtc.error
            ? `Not working on this computer (${rtc.error}). Guests fall back to the frame-by-frame picture.`
            : 'On. Guests who can reach this computer directly get video.';
      }
      const turnStatus = root.querySelector('#ext-ts-turnStatus');
      if (turnStatus) {
        const portEl = root.querySelector('#ext-ts-turnPort');
        const hostEl = root.querySelector('#ext-ts-turnHost');
        if (portEl) portEl.disabled = !s.turnEnabled;
        if (hostEl) hostEl.disabled = !s.turnEnabled;
        turnStatus.textContent = !s.turnEnabled
          ? 'Off.'
          : !turn.supported
            ? 'The relay package is not available in this build.'
            : turn.running
              ? `Running on UDP port ${turn.port}. Guests are told to use ${turn.host}:${turn.port}.`
              : `Not running${turn.error ? `: ${turn.error}` : '.'}`;
      }
    }

    _renderSettings() {
      const root = this.settingsContainer;
      if (!root) return;
      const avail = root.querySelector('#ext-ts-availability');
      if (avail) {
        avail.textContent = this.status.available
          ? 'Network Sharing and the web backend are on. New links work right away.'
          : (this.status.reason || 'Enable Network Sharing and its web backend in Settings to share tabs.');
      }
      this._renderStreamingSettings(root);
      const list = root.querySelector('#ext-ts-list');
      if (!list) return;
      const shares = this.status.shares || [];
      const stopAll = root.querySelector('#ext-ts-stopAll');
      if (stopAll) stopAll.disabled = !shares.length;
      if (!shares.length) {
        list.innerHTML = '<div class="luma-empty">No tabs are shared. Right-click a tab and choose Share tab to start.</div>';
        return;
      }
      list.innerHTML = shares.map((s) => `
        <div class="luma-card ext-ts-row" data-id="${esc(s.id)}">
          <div>
            <div class="ext-ts-row-title">${esc(s.title || s.pageUrl || 'Tab')}</div>
            <div class="ext-ts-row-url" title="${esc(s.pageUrl)}">${esc(s.pageUrl)}</div>
          </div>
          <div class="ext-ts-meta">
            <span class="luma-dot ${s.live ? (s.viewers ? 'ok' : 'warn') : 'bad'}"></span>
            <span>${s.live ? esc(viewersLabel(s.viewers || 0)) + (s.videoViewers ? ` (${s.videoViewers} on video)` : '') : 'Tab not running (link resumes when it is restored)'}</span>
          </div>
          <div class="ext-ts-row-actions">
            <select class="luma-field-select" data-act="mode" data-id="${esc(s.id)}" aria-label="Link type">
              <option value="view"${s.mode === 'view' ? ' selected' : ''}>View only</option>
              <option value="interact"${s.mode === 'interact' ? ' selected' : ''}>View and interact</option>
            </select>
            <button type="button" class="luma-btn luma-btn--sm" data-act="copy" data-id="${esc(s.id)}"${s.url ? '' : ' disabled'}>Copy link</button>
            <button type="button" class="luma-btn luma-btn--sm" data-act="show" data-id="${esc(s.id)}"${s.live ? '' : ' disabled'}>Open tab</button>
            <button type="button" class="luma-btn luma-btn--sm danger" data-act="stop" data-id="${esc(s.id)}">Stop</button>
          </div>
        </div>`).join('');
    }
  }

  const instance = new TabShareRenderer();
  window.__ext_tab_share = {
    activate: (context) => instance.activate(context),
    deactivate: () => instance.deactivate(),
    _instance: instance,
  };
})();
