import MyToolsTab from './ui/MyToolsTab.js';

if (!window.LumaSetupExt) {
  console.error('[tool-forge] LumaSetupExt not present');
} else {
  window.LumaSetupExt.registerTab({ id: 'tool-forge', label: 'My Tools', mount: (el, api) => new MyToolsTab(el, api).mount() });
}
