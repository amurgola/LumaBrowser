export default class SettingsTabs {
  static PANE_IDS = {
    extensions: 'extSubpaneExtensions',
    inactiveExtensions: 'extSubpaneInactive',
    chromeExtensions: 'extSubpaneChrome',
    about: 'aboutSubpaneAbout',
    license: 'aboutSubpaneLicense',
  };

  static EXTENSION_SUBTABS = `
        <button class="settings-subtab active" data-subtab="extensions" data-parent="extensions">Extensions <span class="settings-subtab-badge" id="extActiveCountBadge"></span></button>
        <button class="settings-subtab" data-subtab="inactiveExtensions" data-parent="extensions">Inactive</button>
        <button class="settings-subtab" data-subtab="chromeExtensions" data-parent="extensions">Chrome Extensions</button>
      `;

  static ABOUT_SUBTABS = `
          <button class="settings-subtab active" data-subtab="about" data-parent="about">About</button>
          <button class="settings-subtab" data-subtab="license" data-parent="about">Privacy</button>
        `;

  constructor({ onTab, onSubtab }) {
    this._onTab = onTab;
    this._onSubtab = onSubtab;
    this._tabButtons = null;
    this._activeSubtab = { extensions: 'extensions', about: 'about' };
  }

  init() {
    this._tabButtons = document.querySelector('.settings-tabs');
    if (!this._tabButtons) return null;
    this._tabButtons.querySelectorAll('.settings-tab').forEach((btn) => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    this._addTabButton('extensions', 'Extensions');
    this._addTabButton('about', 'About');
    const panes = this._buildExtensionsSection();
    this._fillAboutSubtabs();
    panes.license = document.getElementById(SettingsTabs.PANE_IDS.license) || null;
    return panes;
  }

  switchTab(tabName) {
    if (!this._tabButtons) return;
    this._tabButtons.querySelectorAll('.settings-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.settings-section').forEach((section) => {
      section.classList.toggle('active', section.id === `${tabName}Settings`);
    });
    this._onTab(tabName);
    if (tabName === 'extensions' || tabName === 'about') this.switchSubtab(tabName, this._activeSubtab[tabName]);
  }

  hasStrip() {
    return !!this._tabButtons;
  }

  hasTab(tabName) {
    return !!this._tabButton(tabName);
  }

  addExtensionTab(tabName, label) {
    if (!this._tabButtons) return null;
    const existing = document.getElementById(`${tabName}Settings`);
    if (existing && this.hasTab(tabName)) return existing;
    const btn = document.createElement('button');
    btn.className = 'settings-tab';
    btn.dataset.tab = tabName;
    btn.dataset.extensionTab = '1';
    btn.textContent = label;
    btn.addEventListener('click', () => this.switchTab(tabName));
    const extensionsBtn = this._tabButtons.querySelector('.settings-tab[data-tab="extensions"]');
    if (extensionsBtn) this._tabButtons.insertBefore(btn, extensionsBtn);
    else this._tabButtons.appendChild(btn);
    const section = document.createElement('div');
    section.className = 'settings-section';
    section.id = `${tabName}Settings`;
    SettingsTabs._appendSection(section);
    return section;
  }

  removeExtensionTab(tabName) {
    if (!this._tabButtons) return;
    const btn = this._tabButton(tabName);
    const wasActive = !!(btn && btn.classList.contains('active'));
    if (btn) btn.remove();
    const section = document.getElementById(`${tabName}Settings`);
    if (section) section.remove();
    if (wasActive) this.switchTab('general');
  }

  switchSubtab(parent, subtab) {
    this._activeSubtab[parent] = subtab;
    const section = document.getElementById(parent === 'extensions' ? 'extensionsSettings' : 'aboutSettings');
    if (!section) return;
    section.querySelectorAll('.settings-subtab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.subtab === subtab);
    });
    section.querySelectorAll('.settings-subpane').forEach((pane) => {
      pane.classList.toggle('active', pane.id === SettingsTabs.PANE_IDS[subtab]);
    });
    this._onSubtab(subtab);
  }

  _tabButton(tabName) {
    if (!this._tabButtons) return null;
    return [...this._tabButtons.querySelectorAll('.settings-tab')].find((b) => b.dataset.tab === tabName) || null;
  }

  _addTabButton(tab, label) {
    const btn = document.createElement('button');
    btn.className = 'settings-tab';
    btn.dataset.tab = tab;
    btn.textContent = label;
    btn.addEventListener('click', () => this.switchTab(tab));
    this._tabButtons.appendChild(btn);
  }

  _buildExtensionsSection() {
    const section = document.createElement('div');
    section.className = 'settings-section';
    section.id = 'extensionsSettings';
    const subtabs = document.createElement('div');
    subtabs.className = 'settings-subtabs';
    subtabs.innerHTML = SettingsTabs.EXTENSION_SUBTABS;
    section.appendChild(subtabs);
    const panes = {
      extensions: SettingsTabs._pane(section, 'extSubpaneExtensions', 'extensionsSettingsBody', true),
      inactive: SettingsTabs._pane(section, 'extSubpaneInactive', 'inactiveExtensionsSettingsBody', false),
      chrome: SettingsTabs._pane(section, 'extSubpaneChrome', 'chromeExtensionsSettingsBody', false),
    };
    SettingsTabs._appendSection(section);
    this._wireSubtabs(subtabs, 'extensions');
    return panes;
  }

  _fillAboutSubtabs() {
    const subtabs = document.getElementById('aboutSubtabs');
    if (!subtabs) return;
    subtabs.innerHTML = SettingsTabs.ABOUT_SUBTABS;
    this._wireSubtabs(subtabs, 'about');
  }

  _wireSubtabs(subtabs, parent) {
    subtabs.querySelectorAll('.settings-subtab').forEach((btn) => {
      btn.addEventListener('click', () => this.switchSubtab(parent, btn.dataset.subtab));
    });
  }

  static _pane(section, paneId, bodyId, active) {
    const pane = document.createElement('div');
    pane.className = active ? 'settings-subpane active' : 'settings-subpane';
    pane.id = paneId;
    const body = document.createElement('div');
    body.id = bodyId;
    pane.appendChild(body);
    section.appendChild(pane);
    return body;
  }

  static _appendSection(section) {
    const settingsMain = document.querySelector('.settings-main');
    const formButtons = document.querySelector('.settings-content .form-buttons');
    if (settingsMain) settingsMain.appendChild(section);
    else if (formButtons) formButtons.parentNode.insertBefore(section, formButtons);
    else {
      const content = document.querySelector('.settings-content');
      if (content) content.appendChild(section);
    }
  }
}
