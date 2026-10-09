const TaskInterval = require('./TaskInterval');

class ScheduledTaskPrompt {
  static TOOL_DESC_CHARS = 220;

  static build(task, toolGroups = null) {
    return [
      '<scheduled_task_mode>',
      ...ScheduledTaskPrompt._setupGuide(),
      ...ScheduledTaskPrompt._runToolsBlock(toolGroups),
      ...ScheduledTaskPrompt._settingsNote(),
      ...ScheduledTaskPrompt._existingTask(task),
      '</scheduled_task_mode>',
    ].join('\n');
  }

  static toolListLines(groups) {
    const lines = [];
    for (const group of groups) {
      if (!group || !Array.isArray(group.tools) || !group.tools.length) continue;
      if (!group.tools.some((t) => t.description)) {
        lines.push(`- ${group.label}: ${group.tools.map((t) => t.name).join(', ')}`);
        continue;
      }
      lines.push(`- ${group.label}:`);
      for (const t of group.tools) {
        lines.push(`  - ${t.name}: ${ScheduledTaskPrompt._oneLine(t.description || t.label || '', ScheduledTaskPrompt.TOOL_DESC_CHARS)}`);
      }
    }
    return lines;
  }

  static _setupGuide() {
    return [
      'You are setting up a SCHEDULED TASK for the user: a recurring background',
      'run where an AI agent (you, but in a fresh session with no memory of this',
      'conversation) carries out a fixed instruction on a fixed interval, using',
      'the model and tools configured for THIS chat. Each run\'s final message is',
      'recorded in the task\'s run history for the user to review.',
      '',
      'Your job in this conversation:',
      '1. Learn exactly what the task should do. Ask brief clarifying questions',
      '   when the request is ambiguous (which variant, which source, what',
      '   format, where to send results). One round of questions, not an',
      '   interrogation.',
      '2. Learn how often it should run. Supported range: every',
      `   ${TaskInterval.MIN_EVERY_MINUTES} minutes up to every ${TaskInterval.MAX_EVERY_MINUTES} minutes (7 days).`,
      '   Exact times of day are not supported, only intervals; if the user asks',
      '   for "daily at 9am", explain it runs on an interval and offer every 24h.',
      '3. Summarize the task (what it does + frequency) and ask the user to',
      '   confirm.',
      '4. ONLY after the user confirms, call create_scheduled_task. It creates',
      '   the task and runs an immediate test; report the test outcome honestly.',
      '   If the test failed, say what failed and offer to adjust the task.',
      '',
      'EXCEPTION, the setup form: the conversation may OPEN with a submitted',
      'setup form (a first user message starting "(Setup form submitted)").',
      'That form IS steps 1-3 already done: call create_scheduled_task right',
      'away with the form\'s values: tighten its task description into a fully',
      'self-contained run prompt, and honor the form\'s test choice via',
      'run_test. Ask first ONLY if something essential is missing (for example',
      'a webhook is implied but no URL was given).',
      '',
      'Whenever the user asks to run or test the task immediately, call',
      'run_scheduled_task and report the run\'s outcome.',
      '',
      'Writing the task prompt (the create tool\'s `prompt` field): the runner',
      'has NO memory of this chat, so the prompt must be fully self-contained.',
      'Spell out sources or URLs to use, the exact data to collect, units and',
      'formats, any webhook URL and payload shape, and what the final report',
      'should contain. Write it as a direct instruction ("Fetch ..., then ...").',
      'Name the exact tool(s) each run must call, by tool name, at each step.',
      '',
    ];
  }

  static _runToolsBlock(toolGroups) {
    if (!Array.isArray(toolGroups)) return [];
    return [
      '<run_tools>',
      'The runs get exactly these tools (this chat\'s gear-panel selection,',
      'read live). When the user says "the tool" they mean one of these:',
      ...ScheduledTaskPrompt.toolListLines(toolGroups),
      'A listed tool already carries its own credentials, endpoints and',
      'delivery targets: never ask the user for those. If the task needs',
      'something no listed tool provides, say so and point the user to the',
      'gear panel to enable it before creating the task.',
      '</run_tools>',
      '',
    ];
  }

  static _settingsNote() {
    return [
      'The user controls which model and tools the runs use via this chat\'s',
      'model picker and gear panel (tool checklist). If they ask, point them',
      'there; you cannot change those settings yourself.',
    ];
  }

  static _existingTask(task) {
    if (!task) return [];
    return [
      '',
      'A task ALREADY EXISTS for this conversation. The user is here to review',
      'or change it. Use update_scheduled_task for any change they ask for',
      '(including pausing/resuming via `enabled`). Do not create a second task.',
      'Current task state:',
      JSON.stringify({
        title: task.title,
        prompt: task.prompt,
        frequency: TaskInterval.describe(task.intervalMs),
        everyMinutes: TaskInterval.toMinutes(task.intervalMs),
        enabled: task.enabled,
        lastRunAt: task.lastRunAt || null,
        lastStatus: task.lastStatus || null,
        nextRunAt: task.nextRunAt || null,
      }, null, 2),
    ];
  }

  static _oneLine(text, max) {
    const flat = String(text || '').replace(/\s+/g, ' ').trim();
    return flat.length > max ? flat.slice(0, max - 1).trimEnd() + String.fromCharCode(0x2026) : flat;
  }
}

module.exports = ScheduledTaskPrompt;
