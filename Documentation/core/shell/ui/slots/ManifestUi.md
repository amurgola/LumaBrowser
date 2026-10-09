# ManifestUi

`core/shell/ui/slots/ManifestUi.js` (ES module)

Registers the UI an extension declares in its manifest (settings page, navigation-bar button and panel) before its renderer's activate().

## Methods

- `ManifestUi.register(slotManager, ext)` returns `{ panelContainer, settingsContainer }`:
  `settings` -> `register('settings-tab', id, settings.html || settings._resolvedHtml,
  { label: settings.label || name, tabId: settings.tabId || id, placement:
  settings.placement || 'extensions' })` (`placement: 'tab'` asks for a
  top-level Settings tab);
  `navigationBar` -> the panel in `panel.location` (aliases `bottom` ->
  `bottom-bar`, `right` -> `right-sidebar`) and a `toolbar-button` with tooltip
  `Toggle <label>`, the icon, and a [DockPanel](DockPanel.md) toggle when there is a panel.
- `ManifestUi.normalizeLocation(location)`.

## Globals

None.
