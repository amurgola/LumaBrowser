import NetworkWatcherTab from './ui/NetworkWatcherTab.js';

const tab = new NetworkWatcherTab();

window.__ext_network_watcher = {
  activate: (context) => tab.activate(context),
  deactivate: () => tab.deactivate(),
};
