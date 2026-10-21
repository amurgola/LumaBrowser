# SettingsTabs

`core/shell/ui/settings/SettingsTabs.js` (ES module)

The Settings modal's tab strip: Extensions and About after the page's General tab, the Extensions section with its four subtabs and the host for the "+" add menu, the About subtabs, the top-level tabs extensions ask for, and switching.

## Methods

- `new SettingsTabs({ onTab(tabName), onSubtab(subtab) })`.
- `init()` returns `{ extensions, inactive, browse, chrome, license, addMenuHost }`:
  the pane bodies (`#extensionsSettingsBody`, `#inactiveExtensionsSettingsBody`,
  `#browseExtensionsSettingsBody`, `#chromeExtensionsSettingsBody`,
  `#aboutSubpaneLicense`) and the `#extAddMenuHost` span at the end of the
  Extensions subtab strip for [ExtensionAddMenu](ExtensionAddMenu.md); null
  without `.settings-tabs`. The section goes into `.settings-main`, else into
  `.settings-content`.
- `switchTab(tabName)`: activates the tab and `#<tab>Settings`, calls `onTab`,
  then restores the last subtab of Extensions or About.
- `switchSubtab(parent, subtab)`: `'extensions'` (`extensions`,
  `inactiveExtensions`, `browseExtensions`, `chromeExtensions`) or `'about'`
  (`about`, `license`).
- `hasStrip()`, `hasTab(tabName)`.
- `addExtensionTab(tabName, label)`: a tab an extension owns, inserted before
  Extensions (so it reads as a feature, not an add-on) with its own
  `#<tabName>Settings` section; returns the section (the existing one when
  the tab is already there; null without a strip).
- `removeExtensionTab(tabName)`: drops the tab and section; an active tab
  falls back to General.

## Globals

None. Expects the page's `.settings-tabs`, `.settings-main`, `#aboutSettings`, `#aboutSubtabs` and `#aboutSubpaneLicense`.
