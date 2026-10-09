const ScheduledTaskPrompt = require('../scheduled-task/ScheduledTaskPrompt');
const TriggerFacts = require('./TriggerFacts');
const TriggerModeGuide = require('./TriggerModeGuide');
const TriggerStateView = require('./TriggerStateView');

class TriggerModePrompt {
  static LIST_CAP = 40;
  static SAMPLE_PREVIEW_CHARS = 1500;

  static build(trigger, toolGroups = null, bases = null, extras = {}) {
    return [
      '<trigger_mode>',
      ...TriggerModeGuide.lines(),
      ...TriggerModePrompt._runTools(toolGroups),
      ...TriggerModePrompt._settingsNote(),
      ...TriggerModePrompt._agents(extras.agents),
      ...TriggerModePrompt._tabs(extras.tabs),
      ...TriggerModePrompt._monitors(extras.monitors),
      ...TriggerModePrompt._artifacts(extras.artifacts),
      ...TriggerModePrompt._existing(trigger, extras, bases),
      '</trigger_mode>',
    ].join('\n');
  }

  static _runTools(toolGroups) {
    if (!Array.isArray(toolGroups)) return [];
    return [
      '<run_tools>',
      'Runs in `agent` mode get exactly these tools (this chat\'s gear-panel',
      'selection, read live). When the user says "the tool" they mean one of these:',
      ...ScheduledTaskPrompt.toolListLines(toolGroups),
      'A listed tool already carries its own credentials, endpoints and',
      'delivery targets: never ask the user for those. If the trigger needs',
      'something no listed tool provides, say so and point the user to the',
      'gear panel to enable it before creating the trigger.',
      '</run_tools>',
      '',
    ];
  }

  static _settingsNote() {
    return [
      'The user controls which model and tools the runs use via this chat\'s',
      'model picker and gear panel. If they ask, point them there; you cannot',
      'change those settings yourself.',
    ];
  }

  static _agents(agents) {
    if (!Array.isArray(agents)) return [];
    const lines = agents.map((a) => `- ${a.id}: ${a.name}`
      + (a.description ? ' - ' + TriggerFacts.oneLine(a.description, 100) : '')
      + (a.kbDocs ? ` (${a.kbDocs} knowledge docs)` : ''));
    return ['<agents>', ...(lines.length ? lines : ['(none configured; runs use the trigger\'s own agent)']), '</agents>'];
  }

  static _tabs(tabs) {
    if (!Array.isArray(tabs)) return [];
    const lines = tabs.slice(0, TriggerModePrompt.LIST_CAP).map((t) => `- ${t.partition}: ${TriggerFacts.oneLine(t.title || '', 80)}`
      + ` (${t.host || 'no host'}${t.live ? '' : ', not restored yet'})`);
    const none = '(none: the user can right-click a tab and choose Persist Tab; a notification trigger can still scope by host)';
    return ['<persisted_tabs>', ...(lines.length ? lines : [none]), '</persisted_tabs>'];
  }

  static _monitors(monitors) {
    if (Array.isArray(monitors) && monitors.length) {
      return [
        '',
        '<page_monitors>',
        'Page Watcher monitors a `page` trigger can bind to (use the id as monitor_id):',
        ...monitors.slice(0, TriggerModePrompt.LIST_CAP).map((m) => `- id ${m.id}: ${TriggerFacts.oneLine(m.name || '', 60)}`
          + ` (${TriggerFacts.oneLine(m.url || '', 100)})${m.enabled ? '' : ' [paused]'}`),
        '</page_monitors>',
      ];
    }
    if (!monitors) return [];
    return ['', 'The user has no Page Watcher monitors yet; a `page` trigger needs one', '(created in the Page Watcher panel first).'];
  }

  static _artifacts(artifacts) {
    if (!Array.isArray(artifacts) || !artifacts.length) return [];
    return [
      '',
      '<live_artifacts>',
      'Live artifacts a trigger can feed (use the rootId as artifact_root_id):',
      ...artifacts.slice(0, TriggerModePrompt.LIST_CAP).map((a) => `- rootId ${a.rootId}: ${TriggerFacts.oneLine(a.title || '', 80)}`),
      '</live_artifacts>',
    ];
  }

  static _existing(trigger, extras, bases) {
    if (!trigger) return [];
    return [
      '',
      'A trigger ALREADY EXISTS for this conversation. The user is here to review',
      'or change it. Use update_trigger for changes (including pause/arm via',
      '`enabled`), set_sample / test_trigger for the arming flow. Do not create',
      'a second trigger. Current state:',
      JSON.stringify(TriggerStateView.build(trigger, extras, bases), null, 2),
      ...TriggerModePrompt._deliveries(extras.deliveries),
      ...TriggerModePrompt._sample(trigger.sample),
    ];
  }

  static _deliveries(deliveries) {
    if (!Array.isArray(deliveries) || !deliveries.length) return [];
    return [
      'Recent deliveries (newest first; every event the trigger saw and what',
      'happened to it. When the user asks why nothing ran, answer from this):',
      JSON.stringify(deliveries),
    ];
  }

  static _sample(sample) {
    if (!sample) return [];
    return ['Sample event (what test_trigger runs; trimmed):', TriggerFacts.oneLine(JSON.stringify(sample), TriggerModePrompt.SAMPLE_PREVIEW_CHARS)];
  }
}

module.exports = TriggerModePrompt;
