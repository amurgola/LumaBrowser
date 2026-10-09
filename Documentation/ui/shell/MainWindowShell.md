# Main window shell

`index.html`, `ui/shell/`, `ui/shell/css/`, `preload.js`

The main browser window: the frameless title bar with the tab strip, the toolbar
(address bar, star, extension buttons, AI activity, downloads, gear), the find
and bookmark edit bars, the bookmarks bar, the native page view area, the
Settings modal, the setup wizard modal and the History and Bookmarks modals.
Main loads it with `MainWindow` (`loadFile('index.html')`, preload `preload.js`).

## Page

- `index.html` holds markup only. It links the shell stylesheets in the legacy
  cascade order, then `core/llm-server/ui/css/luma-components.css` and
  `extensions/extension-styles.css`, the classic `core/shell/ui/luma-modal.js`,
  then the browser-data stylesheets, and one `<script type="module"
  src="ui/shell/entry.js">`.
- `ui/shell/css/` holds the legacy inline `<style>` blocks split by component
  with identical selectors and rules (verified at port time: the joined rules
  equal the legacy text, comments aside): `base`, `forms-base`, `notification-log`, `settings-base`,
  `network-watcher`, `ai-chat-panel`, `theme`,
  `chrome-layout`, `settings-dark`, `general-settings`, `dark-overrides`,
  `ai-activity`, `ai-chat-dark`, `responsive`, `titlebar`, `url-bar`,
  `tab-strip`, `icon-buttons`, `polish`, `right-panel`, `settings-modal`,
  `settings-content`, `right-panel-refined`, `setup-wizard`, and from the
  `bd-styles` block `browser-data-internal-tabs`, `-find-edit-bars`,
  `-downloads-button`, `-bookmarks-bar`, `-url-autocomplete`, `-modals`,
  `-context-menu`.
- The page is loaded from `file://`, where module imports into `core/` and
  `extensions/ui-kit/ui/` resolve as file paths.

## Modules

[entry](entry.md) builds [ShellApp](app/ShellApp.md), the composition root.

| Folder | Classes |
|---|---|
| `app/` | [ShellApp](app/ShellApp.md), [ShellGlobals](app/ShellGlobals.md), [ExtensionRendererLoader](app/ExtensionRendererLoader.md), [SetupWizardLauncher](app/SetupWizardLauncher.md) |
| `boot/`, `window/` | [BootLog](boot/BootLog.md), [PlatformClass](boot/PlatformClass.md), [WindowControls](window/WindowControls.md) |
| `layout/` | [ViewBoundsMath](layout/ViewBoundsMath.md), [ViewBoundsReporter](layout/ViewBoundsReporter.md), [PanelSizeStore](layout/PanelSizeStore.md), [PanelResizer](layout/PanelResizer.md) |
| `tabs/` | [TabStore](tabs/TabStore.md), [TabStripView](tabs/TabStripView.md), [TabActions](tabs/TabActions.md), [ClosedTabStack](tabs/ClosedTabStack.md), [TabOrderCommit](tabs/TabOrderCommit.md), [TabMenuContributors](tabs/TabMenuContributors.md), [TabContextMenu](tabs/TabContextMenu.md), [PersistedTabsMenu](tabs/PersistedTabsMenu.md), [TabStripInput](tabs/TabStripInput.md), [TabEventSync](tabs/TabEventSync.md) |
| `keyboard/`, `debug/` | [AcceleratorTable](keyboard/AcceleratorTable.md), [AcceleratorActions](keyboard/AcceleratorActions.md), [ChromeKeyboard](keyboard/ChromeKeyboard.md), [DebugTools](debug/DebugTools.md) |
| `nav/`, `omnibox/` | [NavButtons](nav/NavButtons.md), [SessionHistoryMenu](nav/SessionHistoryMenu.md), [UrlSecurityBadge](nav/UrlSecurityBadge.md), [ChromeKind](nav/ChromeKind.md), [SearchEngineChoice](omnibox/SearchEngineChoice.md), [OmniboxResolver](omnibox/OmniboxResolver.md), [AddressBar](omnibox/AddressBar.md), [UrlAutocomplete](omnibox/UrlAutocomplete.md), [SuggestionsHtml](omnibox/SuggestionsHtml.md) |
| `overlay/` | [ChromeOverlayHost](overlay/ChromeOverlayHost.md), [MenuHtml](overlay/MenuHtml.md), [PopupMenu](overlay/PopupMenu.md), [OverlayActionRouter](overlay/OverlayActionRouter.md) |
| `favicons/`, `notifications/`, `permissions/` | [FaviconCache](favicons/FaviconCache.md), [NotificationLog](notifications/NotificationLog.md), [NotificationLogHtml](notifications/NotificationLogHtml.md), [WebhookNotifier](notifications/WebhookNotifier.md), [PermissionPrompts](permissions/PermissionPrompts.md) |
| `bookmarks/`, `history/`, `find/`, `downloads/` | [BookmarkTree](bookmarks/BookmarkTree.md), [BookmarkNodeActions](bookmarks/BookmarkNodeActions.md), [BookmarkFolderMenu](bookmarks/BookmarkFolderMenu.md), [BookmarkContextMenu](bookmarks/BookmarkContextMenu.md), [BookmarkDragDrop](bookmarks/BookmarkDragDrop.md), [BookmarksBar](bookmarks/BookmarksBar.md), [BookmarkStar](bookmarks/BookmarkStar.md), [BookmarkEditBar](bookmarks/BookmarkEditBar.md), [BookmarkManager](bookmarks/BookmarkManager.md), [HistoryModal](history/HistoryModal.md), [HistoryDayLabel](history/HistoryDayLabel.md), [FindBar](find/FindBar.md), [Downloads](downloads/Downloads.md), [DownloadText](downloads/DownloadText.md), [DownloadsMenuHtml](downloads/DownloadsMenuHtml.md) |
| `activity/` | [AiActivityPanel](activity/AiActivityPanel.md), [AiActivityState](activity/AiActivityState.md), [AiActivityHtml](activity/AiActivityHtml.md) |
| `settings/` | [SettingsModal](settings/SettingsModal.md), [SettingsMenu](settings/SettingsMenu.md), [SettingsFeedback](settings/SettingsFeedback.md), [ToolGroupsView](settings/ToolGroupsView.md), [CopyButton](settings/CopyButton.md), [BrowsingDataCleaner](settings/BrowsingDataCleaner.md), [BrowserDataSettings](settings/BrowserDataSettings.md) |
| `settings/general/` | [GeneralSettings](settings/general/GeneralSettings.md), [SettingToggle](settings/general/SettingToggle.md), [RestartNotes](settings/general/RestartNotes.md), [TelemetrySwitch](settings/general/TelemetrySwitch.md), [CliShimSwitch](settings/general/CliShimSwitch.md), [IdeInstallerList](settings/general/IdeInstallerList.md), [LlmServerSettings](settings/general/LlmServerSettings.md), [ApiPortSetting](settings/general/ApiPortSetting.md), [EndpointToolsPanel](settings/general/EndpointToolsPanel.md), [ApiMcpGroups](settings/general/ApiMcpGroups.md), [GuideViewer](settings/general/GuideViewer.md), [GuideMarkdown](settings/general/GuideMarkdown.md), [CollapsibleSections](settings/general/CollapsibleSections.md) |
| `settings/security/`, `settings/sharing/` | [ApiSecurityPanel](settings/security/ApiSecurityPanel.md), [ApiKeysList](settings/security/ApiKeysList.md), [SitePermissionsPanel](settings/security/SitePermissionsPanel.md), [LocalApiPanel](settings/security/LocalApiPanel.md), [HarnessConnectionsPanel](settings/security/HarnessConnectionsPanel.md), [NetworkSharingPanel](settings/sharing/NetworkSharingPanel.md), [SharingFirewall](settings/sharing/SharingFirewall.md), [SharingWebTools](settings/sharing/SharingWebTools.md), [SharingTokensList](settings/sharing/SharingTokensList.md), [SharingPeersList](settings/sharing/SharingPeersList.md) |
| `settings/providers/` | [ProviderList](settings/providers/ProviderList.md), [DefaultProviderControl](settings/providers/DefaultProviderControl.md), [DefaultProviderOptions](settings/providers/DefaultProviderOptions.md), [ImageDefaultRows](settings/providers/ImageDefaultRows.md), [ManagedProviderCard](settings/providers/ManagedProviderCard.md), [PeerProviderCard](settings/providers/PeerProviderCard.md), [EditableProviderCard](settings/providers/EditableProviderCard.md), [AddProviderForm](settings/providers/AddProviderForm.md), [PeerDiscovery](settings/providers/PeerDiscovery.md) |

Shared library classes used: HtmlEscaper, Dialogs, Clipboard
(`core/llm-server/ui/js/`).

## Collaborators

Wired in [entry](entry.md) and built by [ShellApp](app/ShellApp.md):

- `core/shell/ui/slots/UISlotManager`: `new UISlotManager({ hooks })` with
  hooks `{ toast, markSaved, closeSettings, rerunSetupWizard }`; the shell calls
  `init()`, `initSettingsTabs()`, `switchSettingsTab(tab)`,
  `loadExtensions(list, { electronAPI, ipcBridge, browserRenderer, slotManager })`
  and `refreshTelemetryPanel()`.
- `core/browser/ui/BrowserRenderer`: `init(tabsMap, getActiveTabId)` and
  `emit('tabCreated'|'tabClosed'|'tabNavigated'|'urlChanged'|'activeTabChanged', ...)`.
- `core/shell/ui/wizard/SetupWizard`: `new SetupWizard({ modalEl, onComplete }).start()`.
- IPCBridgeRenderer and TabSession are not used by the shell.

The Settings > About subtab button labelled "Privacy" (was "License") is
rendered by the slot manager; its pane keeps the id `aboutSubpaneLicense`.

## Window globals

Written (legacy contract, see [ShellGlobals](app/ShellGlobals.md)):
`createNewTab`, `closeTab`, `addLogEntry`, `hideNotificationLog`,
`updateWebhookStatus`, `handleNotification`,
`registerTabMenuContributor`, `openSettings`, `closeSettings`, `gsMarkSaved`,
`settingsToast`, `__rerunSetupWizard`, `__loadExtensionRenderers`,
`browserRenderer`, `uiSlotManager`.

Read: the preload APIs (`electronAPI`, `ipcBridge`, `tabAPI`, `historyAPI`,
`bookmarksAPI`, `browserSettingsAPI`, `browserDataAPI`, `chromeOverlayAPI`,
`permissionPromptAPI`, `windowAPI`, `viewDebugAPI`, `modelStatusAPI`,
`llmQueueAPI`, `localApiAPI`, `sharingAPI`, `imageServersAPI`,
`__LUMA_BOOT_START`), `LumaModal`, `lumaAiChatPanel`,
`localStorage`, `navigator.clipboard`, `navigator.platform`.
