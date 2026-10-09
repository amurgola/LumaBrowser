import ActivityLogTab from './ui/ActivityLogTab.js';

const tab = new ActivityLogTab();

window.__ext_activity_log = {
  activate: (context) => tab.activate(context),
  deactivate: () => tab.deactivate(),
};
