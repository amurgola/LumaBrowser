import BootLog from '../boot/BootLog.js';
import PlatformClass from '../boot/PlatformClass.js';
import ShellGlobals from './ShellGlobals.js';
import ExtensionRendererLoader from './ExtensionRendererLoader.js';
import SetupWizardLauncher from './SetupWizardLauncher.js';
import TabStore from '../tabs/TabStore.js';
import TabStripView from '../tabs/TabStripView.js';
import TabActions from '../tabs/TabActions.js';
import ClosedTabStack from '../tabs/ClosedTabStack.js';
import TabMenuContributors from '../tabs/TabMenuContributors.js';
import TabContextMenu from '../tabs/TabContextMenu.js';
import PersistedTabsMenu from '../tabs/PersistedTabsMenu.js';
import TabStripInput from '../tabs/TabStripInput.js';
import TabEventSync from '../tabs/TabEventSync.js';
import AcceleratorActions from '../keyboard/AcceleratorActions.js';
import ChromeKeyboard from '../keyboard/ChromeKeyboard.js';
import DebugTools from '../debug/DebugTools.js';
import ViewBoundsReporter from '../layout/ViewBoundsReporter.js';
import PanelResizer from '../layout/PanelResizer.js';
import WindowControls from '../window/WindowControls.js';
import NavButtons from '../nav/NavButtons.js';
import SessionHistoryMenu from '../nav/SessionHistoryMenu.js';
import ChromeKind from '../nav/ChromeKind.js';
import UrlSecurityBadge from '../nav/UrlSecurityBadge.js';
import AddressBar from '../omnibox/AddressBar.js';
import SearchEngineChoice from '../omnibox/SearchEngineChoice.js';
import UrlAutocomplete from '../omnibox/UrlAutocomplete.js';
import ChromeOverlayHost from '../overlay/ChromeOverlayHost.js';
import PopupMenu from '../overlay/PopupMenu.js';
import OverlayActionRouter from '../overlay/OverlayActionRouter.js';
import FaviconCache from '../favicons/FaviconCache.js';
import NotificationLog from '../notifications/NotificationLog.js';
import WebhookNotifier from '../notifications/WebhookNotifier.js';
import PermissionPrompts from '../permissions/PermissionPrompts.js';
import BookmarkTree from '../bookmarks/BookmarkTree.js';
import BookmarkNodeActions from '../bookmarks/BookmarkNodeActions.js';
import BookmarkFolderMenu from '../bookmarks/BookmarkFolderMenu.js';
import BookmarkContextMenu from '../bookmarks/BookmarkContextMenu.js';
import BookmarkDragDrop from '../bookmarks/BookmarkDragDrop.js';
import BookmarksBar from '../bookmarks/BookmarksBar.js';
import BookmarkStar from '../bookmarks/BookmarkStar.js';
import BookmarkEditBar from '../bookmarks/BookmarkEditBar.js';
import BookmarkManager from '../bookmarks/BookmarkManager.js';
import HistoryModal from '../history/HistoryModal.js';
import FindBar from '../find/FindBar.js';
import Downloads from '../downloads/Downloads.js';
import SettingsFeedback from '../settings/SettingsFeedback.js';
import SettingsModal from '../settings/SettingsModal.js';
import SettingsMenu from '../settings/SettingsMenu.js';
import BrowsingDataCleaner from '../settings/BrowsingDataCleaner.js';
import BrowserDataSettings from '../settings/BrowserDataSettings.js';
import GeneralSettings from '../settings/general/GeneralSettings.js';
import ApiSecurityPanel from '../settings/security/ApiSecurityPanel.js';
import SitePermissionsPanel from '../settings/security/SitePermissionsPanel.js';
import LocalApiPanel from '../settings/security/LocalApiPanel.js';
import HarnessConnectionsPanel from '../settings/security/HarnessConnectionsPanel.js';
import NetworkSharingPanel from '../settings/sharing/NetworkSharingPanel.js';
import ProviderList from '../settings/providers/ProviderList.js';
import AiActivityPanel from '../activity/AiActivityPanel.js';

export default class ShellApp {
  constructor({ SetupWizard, UISlotManager, BrowserRenderer } = {}) {
    this._classes = { SetupWizard, UISlotManager, BrowserRenderer };
  }

  start() {
    BootLog.log('initializeApp start');
    PlatformClass.apply();
    this._build();
    this._installChrome();
    this._installSettings();
    this._installBrowserData();
    this.webhook.install();
    ShellGlobals.publish(this);
    this._startCollaborators();
    this.activity.install();
    this.bounds.queue();
    BootLog.log('initializeApp end (about to gate setup wizard)');
    this.wizard.maybeShow();
  }

  _build() {
    this._buildCore();
    this._buildPopups();
    this._buildBrowserData();
    this._buildSettings();
    this._buildCollaborators();
  }

  _buildCore() {
    this.store = new TabStore();
    this.log = new NotificationLog();
    this.log.install();
    this.bounds = new ViewBoundsReporter(document.querySelector('.webview-container'));
    this.host = new ChromeOverlayHost();
    this.popupMenu = new PopupMenu({ host: this.host });
    this.favicons = new FaviconCache({ onHostIcon: (host) => this.strip.refreshHost(host) });
    this.strip = new TabStripView({ store: this.store, favicons: this.favicons, tabBar: document.querySelector('.tab-bar') });
    this.addressBar = new AddressBar({ el: document.getElementById('urlBar'), store: this.store });
    this.closedTabs = new ClosedTabStack();
    this.tabActions = new TabActions({ store: this.store, addressBar: this.addressBar, closedTabs: this.closedTabs });
    this.engine = new SearchEngineChoice();
    this.webhook = new WebhookNotifier({ store: this.store, log: this.log });
    this.debugTools = new DebugTools({ log: this.log });
    this.contributors = new TabMenuContributors();
  }

  _buildPopups() {
    const { store, host, popupMenu, tabActions } = this;
    this.historyMenu = new SessionHistoryMenu({ store, popupMenu });
    this.nav = new NavButtons({ store, historyMenu: this.historyMenu });
    this.tabMenu = new TabContextMenu({ store, strip: this.strip, tabActions, contributors: this.contributors, popupMenu, host });
    this.persistedMenu = new PersistedTabsMenu({ store, popupMenu });
    this.autocomplete = new UrlAutocomplete({ addressBar: this.addressBar, store, host, engine: this.engine, favicons: this.favicons, tabActions });
    this.prompts = new PermissionPrompts({ store, addressBar: this.addressBar });
    this.downloads = new Downloads({ host, log: this.log });
  }

  _buildBrowserData() {
    const { store, bounds, favicons, tabActions, popupMenu } = this;
    this.tree = new BookmarkTree();
    this.nodeActions = new BookmarkNodeActions({ tree: this.tree });
    this.findBar = new FindBar({ store, bounds, closeEditBar: () => this.editBar.close() });
    this.editBar = new BookmarkEditBar({ tree: this.tree, bounds, closeFindBar: () => this.findBar.close(false), refreshStar: (url) => this.star.refresh(url) });
    this.star = new BookmarkStar({ tree: this.tree, store, editBar: this.editBar });
    this.folderMenu = new BookmarkFolderMenu({ popupMenu, favicons, tabActions });
    this.bookmarkMenu = new BookmarkContextMenu({ popupMenu, tabActions, nodeActions: this.nodeActions });
    this.bookmarksBar = new BookmarksBar({
      tree: this.tree, favicons, folderMenu: this.folderMenu, contextMenu: this.bookmarkMenu,
      dragDrop: new BookmarkDragDrop({ tree: this.tree }), tabActions, bounds,
    });
    this.bookmarkManager = new BookmarkManager({ tree: this.tree, favicons, nodeActions: this.nodeActions, tabActions, bounds });
    this.historyModal = new HistoryModal({ favicons, tabActions, bounds, clearCache: () => this.cleaner.clearCache() });
    this.cleaner = new BrowsingDataCleaner({ log: this.log, historyModal: this.historyModal });
    this.chromeKind = new ChromeKind({ closePopups: () => { this.autocomplete.hide(); this.findBar.close(false); this.editBar.close(); } });
    this.tree.onChange(() => {
      this.bookmarksBar.render();
      if (this.bookmarkManager.isOpen()) this.bookmarkManager.render();
    });
  }

  _buildSettings() {
    const { log, bounds } = this;
    this.feedback = new SettingsFeedback({ log });
    this.settings = new SettingsModal({ bounds, feedback: this.feedback, getSlotManager: () => this.slotManager });
    this.settingsMenu = new SettingsMenu({
      popupMenu: this.popupMenu, host: this.host, store: this.store, tabActions: this.tabActions, downloads: this.downloads,
      findBar: this.findBar, historyModal: this.historyModal, bookmarkManager: this.bookmarkManager, settings: this.settings, cleaner: this.cleaner,
    });
    this.providers = new ProviderList({ log, feedback: this.feedback });
    this.activity = new AiActivityPanel();
  }

  _buildCollaborators() {
    const { SetupWizard, UISlotManager, BrowserRenderer } = this._classes;
    this.browserRenderer = BrowserRenderer ? new BrowserRenderer() : null;
    this.slotManager = UISlotManager ? new UISlotManager({ hooks: this._slotHooks() }) : null;
    this.extensionLoader = new ExtensionRendererLoader({ slotManager: this.slotManager, browserRenderer: this.browserRenderer });
    this.wizard = new SetupWizardLauncher({ SetupWizard, extensionLoader: this.extensionLoader, slotManager: this.slotManager });
  }

  _slotHooks() {
    return {
      toast: (message, kind) => this.feedback.toast(message, kind),
      markSaved: (control, ok, errorMessage) => this.feedback.markSaved(control, ok, errorMessage),
      closeSettings: () => this.settings.close(),
      rerunSetupWizard: () => this.wizard.maybeShow({ force: true }),
    };
  }

  _installChrome() {
    const logClose = document.getElementById('logCloseBtn');
    if (logClose) logClose.addEventListener('click', () => document.getElementById('notificationLog').classList.remove('active'));
    this.keyboard = this._keyboard();
    new TabStripInput({ strip: this.strip, tabActions: this.tabActions, contextMenu: this.tabMenu, persistedMenu: this.persistedMenu }).install();
    this.keyboard.installShortcuts();
    this.nav.install();
    new WindowControls().install();
    this._tabEvents().install();
    this.bounds.install();
    new PanelResizer().install();
  }

  _keyboard() {
    const actions = new AcceleratorActions({
      store: this.store, strip: this.strip, tabActions: this.tabActions, findBar: this.findBar, host: this.host,
      addressBar: this.addressBar, star: this.star, historyModal: this.historyModal, bookmarkManager: this.bookmarkManager,
      downloads: this.downloads, debugTools: this.debugTools,
    });
    return new ChromeKeyboard({
      actions, store: this.store, tabActions: this.tabActions, addressBar: this.addressBar, host: this.host, settings: this.settings,
      popupMenu: this.popupMenu, debugTools: this.debugTools, historyModal: this.historyModal,
      bookmarkManager: this.bookmarkManager, editBar: this.editBar,
    });
  }

  _tabEvents() {
    return new TabEventSync({
      store: this.store, strip: this.strip, addressBar: this.addressBar, nav: this.nav, chromeKind: this.chromeKind,
      star: this.star, favicons: this.favicons, closedTabs: this.closedTabs, persistedMenu: this.persistedMenu,
      prompts: this.prompts, autocomplete: this.autocomplete, findBar: this.findBar, editBar: this.editBar,
      host: this.host, bounds: this.bounds, browserRenderer: this.browserRenderer,
    });
  }

  _installSettings() {
    const feedback = this.feedback;
    this.settingsMenu.install();
    this.providers.install();
    this.settings.install();
    const general = new GeneralSettings({ feedback, settings: this.settings, tabActions: this.tabActions, cleaner: this.cleaner });
    if (!general.install()) return;
    new ApiSecurityPanel({ feedback }).install();
    new SitePermissionsPanel().install();
    new NetworkSharingPanel({ feedback, renderProviders: () => this.providers.render() }).install();
    new LocalApiPanel({ feedback }).install();
    new HarnessConnectionsPanel({ feedback }).install();
  }

  _installBrowserData() {
    this.star.install();
    this.autocomplete.install();
    UrlSecurityBadge.update('');
    this.nav.updateReloadButton();
    this.findBar.install();
    this.downloads.install();
    this.editBar.install();
    this._followFavicons();
    this.bookmarksBar.install();
    this._wireChromeButtons();
    this.historyModal.install();
    this.bookmarkManager.install();
    this.keyboard.installPopupKeys();
    this._installOverlay();
    this._followMainEvents();
    new BrowserDataSettings({
      tabActions: this.tabActions, engine: this.engine, addressBar: this.addressBar, bookmarksBar: this.bookmarksBar, feedback: this.feedback,
    }).load();
    this.tree.reload();
    this.star.refresh();
  }

  _followFavicons() {
    const api = window.browserDataAPI;
    if (!api || typeof api.onFavicon !== 'function') return;
    api.onFavicon((p) => { if (p && p.host && p.dataUrl) this.favicons.store(p.host, p.dataUrl); });
  }

  _wireChromeButtons() {
    const rightPanel = document.getElementById('rightPanel');
    if (rightPanel && typeof MutationObserver === 'function') {
      const sync = () => rightPanel.setAttribute('aria-hidden', rightPanel.classList.contains('ext-hidden') ? 'true' : 'false');
      new MutationObserver(sync).observe(rightPanel, { attributes: true, attributeFilter: ['class'] });
      sync();
    }
    document.getElementById('historyBtn')?.addEventListener('click', () => this.historyModal.open());
    document.getElementById('bookmarkManageBtn')?.addEventListener('click', () => this.bookmarkManager.open());
    document.getElementById('dashboardBtn')?.addEventListener('click', () => { window.electronAPI?.openDashboard?.(); });
  }

  _installOverlay() {
    const router = new OverlayActionRouter({
      host: this.host, popupMenu: this.popupMenu, prompts: this.prompts, log: this.log,
      autocomplete: this.autocomplete, folderMenu: this.folderMenu, downloads: this.downloads,
    });
    this.popupMenu.bindChooser((payload) => router.handleAction(payload));
    router.install();
    this.host.install({
      onResize: () => {
        if (this.log.visible) this.log.render();
        if (this.prompts.size) this.prompts.render();
      },
    });
  }

  _followMainEvents() {
    this.prompts.install();
    if (window.modelStatusAPI && window.modelStatusAPI.onStatus) {
      window.modelStatusAPI.onStatus((p) => { if (p && p.message) this.log.add(p.message, p.type || 'info'); });
    }
    if (window.bookmarksAPI && window.bookmarksAPI.onChanged) {
      window.bookmarksAPI.onChanged(() => {
        if (this.tree.suppressRefresh) return;
        this.tree.reload();
        this.star.refresh();
      });
    }
  }

  _startCollaborators() {
    if (this.browserRenderer) this.browserRenderer.init(this.store.tabs, () => this.store.activeTabId);
    if (this.slotManager) {
      this.slotManager.init();
      this.slotManager.initSettingsTabs();
    }
    this.extensionLoader.loadWhenSetupComplete();
  }
}
