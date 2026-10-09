import AgentsTab from './ui/AgentsTab.js';

if (!window.LumaSetupExt) {
  console.error('[agent-manager] LumaSetupExt not present');
} else {
  window.LumaSetupExt.registerTab({ id: 'agent-manager', label: 'Agents', mount: (el, api) => new AgentsTab(el, api).mount() });
}
