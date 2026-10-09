import DockPanel from './DockPanel.js';

export default class ManifestUi {
  static LOCATION_ALIASES = { bottom: 'bottom-bar', right: 'right-sidebar' };

  static register(slotManager, ext) {
    const results = { panelContainer: null, settingsContainer: null };
    if (ext.settings) results.settingsContainer = ManifestUi._registerSettings(slotManager, ext);
    if (ext.navigationBar) results.panelContainer = ManifestUi._registerNavigation(slotManager, ext);
    return results;
  }

  static normalizeLocation(location) {
    return ManifestUi.LOCATION_ALIASES[location] || location;
  }

  static _registerSettings(slotManager, ext) {
    const html = ext.settings.html || ext.settings._resolvedHtml || '';
    return slotManager.register('settings-tab', ext.id, html, {
      label: ext.settings.label || ext.name,
      tabId: ext.settings.tabId || ext.id,
      placement: ext.settings.placement || 'extensions',
    });
  }

  static _registerNavigation(slotManager, ext) {
    const nav = ext.navigationBar;
    const label = nav.label || ext.name;
    const panelSlot = nav.panel ? ManifestUi.normalizeLocation(nav.panel.location) : null;
    const panelContainer = panelSlot
      ? slotManager.register(panelSlot, ext.id, nav.panel.html || nav.panel._resolvedHtml || '', { label })
      : null;
    slotManager.register('toolbar-button', ext.id, '', {
      label,
      tooltip: nav.tooltip || `Toggle ${label}`,
      icon: nav.icon || null,
      onClick: panelSlot ? ManifestUi._panelToggler(slotManager, panelSlot, ext.id) : undefined,
    });
    return panelContainer;
  }

  static _panelToggler(slotManager, panelSlot, extensionId) {
    return (event) => {
      const container = slotManager.getContainer(panelSlot);
      if (container) DockPanel.toggle(container, extensionId, event && event.currentTarget);
    };
  }
}
