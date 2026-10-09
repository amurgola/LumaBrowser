export default class TriggerForm {
  static INITIAL = { kind: 'webhook', preset: 'generic', mode: 'agent', agent: '', tab: '', respond: 'ack' };

  static SCHEMA = {
    title: 'New trigger',
    subtitle: 'A trigger reacts to an inbound event: this app hosts a webhook URL, and every '
      + 'request to it runs the instruction below using this chat\'s model and the tools '
      + 'checked in its gear panel. The first request is captured as a sample so you can test '
      + 'before arming. LumaBrowser must be running for the URL to answer.',
    submitLabel: 'Start trigger setup',
    fields: [
      {
        key: 'kind', type: 'select', label: 'Event source',
        options: [
          { value: 'webhook', label: 'Webhook URL (something POSTs to this app)' },
          { value: 'file', label: 'Folder on this computer (a file is added or changed)' },
          { value: 'page', label: 'Page Watcher monitor (a watched web page changes)' },
          { value: 'notification', label: 'Web notification (a site in a tab shows one)' },
        ],
      },
      {
        key: 'host', type: 'text', label: 'Site', half: true, showIf: { key: 'kind', equals: 'notification' },
        placeholder: 'discord.com',
        hint: 'notifications from this site count (sub-domains included); optional when a tab is chosen',
      },
      {
        key: 'preset', type: 'select', label: 'Sender', half: true, showIf: { key: 'kind', equals: 'webhook' },
        options: [
          { value: 'generic', label: 'Generic (any caller)' },
          { value: 'slack', label: 'Slack (signing secret, empty ack)' },
          { value: 'github', label: 'GitHub (X-Hub-Signature-256)' },
        ],
        hint: 'Slack and GitHub need their secret entered in the runs view before they fire',
      },
      {
        key: 'monitor', type: 'text', label: 'Page Watcher monitor', showIf: { key: 'kind', equals: 'page' },
        placeholder: 'monitor name or id',
        hint: 'as listed in the Page Watcher panel; the assistant resolves the name',
      },
      {
        key: 'dir', type: 'text', label: 'Folder to watch', browse: 'directory', showIf: { key: 'kind', equals: 'file' },
        placeholder: 'C:\\Users\\you\\Drop',
        hint: 'never the app\'s own folders; sub-folders are not included unless the prompt asks',
      },
      {
        key: 'glob', type: 'text', label: 'File name pattern', half: true, showIf: { key: 'kind', equals: 'file' },
        placeholder: '*.csv',
        hint: 'optional: blank matches every file',
      },
      {
        key: 'allowWrite', type: 'toggle', label: 'Let runs write files inside the folder', showIf: { key: 'kind', equals: 'file' },
      },
      {
        key: 'prompt', type: 'textarea', label: 'What should happen when an event arrives?', required: true,
        placeholder: 'Which fields of the event matter, what to do with them, which tools to call, what to report…',
        hint: 'be specific: each run starts fresh, with no memory of this chat',
      },
      {
        key: 'title', type: 'text', label: 'Trigger name', half: true,
        placeholder: 'e.g. Slack support bot',
        hint: 'optional: left blank, one is picked for you',
      },
      {
        key: 'mode', type: 'select', label: 'Action', half: true,
        options: [
          { value: 'agent', label: 'Agent (uses this chat\'s tools)' },
          { value: 'prompt', label: 'Prompt only (no tools)' },
        ],
      },
      {
        key: 'respond', type: 'select', label: 'Response to the sender', half: true, showIf: { key: 'kind', equals: 'webhook' },
        options: [
          { value: 'ack', label: 'Acknowledge immediately (202)' },
          { value: 'result', label: 'Wait for the result (up to 25 s)' },
        ],
      },
    ],
  };

  static schemaFor(agents, tabs) {
    const hasAgents = !!(agents && agents.length);
    const hasTabs = !!(tabs && tabs.length);
    if (!hasAgents && !hasTabs) return TriggerForm.SCHEMA;
    const fields = [];
    for (const field of TriggerForm.SCHEMA.fields) {
      if (field.key === 'host' && hasTabs) fields.push(TriggerForm.tabField(tabs));
      fields.push(field);
      if (field.key === 'mode' && hasAgents) fields.push(TriggerForm.agentField(agents));
    }
    return { ...TriggerForm.SCHEMA, fields };
  }

  static agentField(agents) {
    return {
      key: 'agent', type: 'select', label: 'Run through', half: true, showIf: { key: 'mode', equals: 'agent' },
      options: [{ value: '', label: 'Trigger agent (this chat\'s tools)' }]
        .concat(agents.map((a) => ({ value: a.id, label: a.name + (a.description ? ' - ' + String(a.description).slice(0, 40) : '') }))),
      hint: 'a configured agent brings its own persona, tools, knowledge and model',
    };
  }

  static tabField(tabs) {
    return {
      key: 'tab', type: 'select', label: 'Persisted tab', half: true, showIf: { key: 'kind', equals: 'notification' },
      options: [{ value: '', label: 'Any tab (scope by site)' }]
        .concat(tabs.map((t) => ({ value: t.partition, label: (t.title || t.url || t.partition).slice(0, 60) + (t.host ? ' (' + t.host + ')' : '') }))),
      hint: 'only that tab\'s notifications count; it keeps running in the background',
    };
  }

  static openingTurn(data, choices = {}) {
    const lines = ['(Setup form submitted)'];
    lines.push('Trigger: ' + String(data.prompt).trim());
    if (data.title && String(data.title).trim()) lines.push('Name: ' + String(data.title).trim());
    lines.push(...TriggerForm._sourceLines(data, choices.tabs || []));
    lines.push('Action: ' + (data.mode === 'prompt' ? 'prompt (no tools)' : 'agent (tools)'));
    if (data.mode !== 'prompt' && data.agent) lines.push(TriggerForm._agentLine(data.agent, choices.agents || []));
    if (data.kind === 'webhook' || !data.kind) lines.push('Response: ' + (data.respond === 'result' ? 'result (sender waits)' : 'ack (202 immediately)'));
    return lines.join('\n');
  }

  static _sourceLines(data, tabs) {
    if (data.kind === 'file') {
      return ['Source: file (watch a folder)', 'Folder: ' + String(data.dir || '').trim(),
        'Pattern: ' + (String(data.glob || '').trim() || '*'), 'Runs may write files in the folder: ' + (data.allowWrite ? 'yes' : 'no')];
    }
    if (data.kind === 'page') return ['Source: page (Page Watcher monitor)', 'Monitor: ' + String(data.monitor || '').trim()];
    if (data.kind === 'notification') return TriggerForm._notificationLines(data, tabs);
    return ['Source: webhook', 'Sender preset: ' + (data.preset || 'generic')];
  }

  static _notificationLines(data, tabs) {
    const lines = ['Source: notification (a web notification shown in a tab)'];
    const host = String(data.host || '').trim();
    if (data.tab) {
      const hit = tabs.find((t) => t.partition === data.tab);
      lines.push('Tab: ' + (hit ? (hit.title || hit.url) + ' (tab_partition ' + hit.partition + ')' : 'tab_partition ' + data.tab));
    }
    if (host) lines.push('Site: ' + host);
    if (!data.tab && !host) lines.push('Scope: not chosen yet; ask which site or persisted tab');
    return lines;
  }

  static _agentLine(agentId, agents) {
    const hit = agents.find((a) => a.id === agentId);
    return 'Run through configured agent: ' + (hit ? hit.name + ' (agent_id ' + hit.id + ')' : 'agent_id ' + agentId);
  }
}
