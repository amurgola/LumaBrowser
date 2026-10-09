import NtfySettingsTab from './ui/NtfySettingsTab.js';

const tab = new NtfySettingsTab();

window.__ext_ntfy_notifier = {
  activate: (context) => tab.activate(context),
  deactivate: () => tab.deactivate(),
};
