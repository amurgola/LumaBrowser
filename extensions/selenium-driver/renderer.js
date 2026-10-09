import SeleniumSettingsTab from './ui/SeleniumSettingsTab.js';

const tab = new SeleniumSettingsTab();

window.__ext_selenium_driver = {
  activate: (context) => tab.activate(context),
  deactivate: () => tab.deactivate(),
};
