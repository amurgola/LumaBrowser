const AgentRunFeature = require('./AgentRunFeature');

module.exports = {
  id: 'agent-run',
  label: 'Agent run',
  description: 'Pause, continue or stop the agent\'s desktop run and answer its approvals from any app (Ctrl+Alt+Shift+Space, Escape, Y, N), with the run shown on the activity ring and island.',
  defaultEnabled: true,
  settingsSchema: AgentRunFeature.settingsSchema(),

  create(deps) {
    const feature = new AgentRunFeature(deps, AgentRunFeature.defaultParts(deps));
    feature.start();
    return feature.instance();
  },
};
