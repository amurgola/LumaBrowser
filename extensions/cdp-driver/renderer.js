import CdpSettingsTab from './ui/CdpSettingsTab.js';

const tab = new CdpSettingsTab();

window.__ext_cdp_driver = {
  activate: (context) => tab.activate(context),
  deactivate: () => tab.deactivate(),
};
