export default class ScheduledTaskForm {
  static EVERY_OPTIONS = [
    { value: '5', label: 'Every 5 minutes' },
    { value: '15', label: 'Every 15 minutes' },
    { value: '30', label: 'Every 30 minutes' },
    { value: '60', label: 'Every hour' },
    { value: '180', label: 'Every 3 hours' },
    { value: '360', label: 'Every 6 hours' },
    { value: '720', label: 'Every 12 hours' },
    { value: '1440', label: 'Every day' },
    { value: '2880', label: 'Every 2 days' },
    { value: '10080', label: 'Every week' },
  ];

  static INITIAL = { everyMinutes: '1440', runTest: true };

  static SCHEMA = {
    title: 'New scheduled task',
    subtitle: 'The task runs in the background on your schedule, using this chat\'s '
      + 'model and the tools checked in its gear panel. Every run is recorded under '
      + 'Scheduled in the sidebar, and you can reopen this chat any time to change '
      + 'or run the task. LumaBrowser must be running for the schedule to fire; '
      + 'closing the window to the tray is fine.',
    submitLabel: 'Start task setup',
    fields: [
      {
        key: 'prompt', type: 'textarea', label: 'What should the task do?', required: true,
        placeholder: 'What to look up or do, where results should go (a webhook URL, for example), and what the report should include…',
        hint: 'be specific: each run starts fresh, with no memory of this chat',
      },
      {
        key: 'title', type: 'text', label: 'Task name', half: true,
        placeholder: 'e.g. Morning mortgage-rate webhook',
        hint: 'optional: left blank, one is picked for you',
      },
      {
        key: 'everyMinutes', type: 'select', label: 'How often', half: true,
        options: ScheduledTaskForm.EVERY_OPTIONS,
      },
      { key: 'runTest', type: 'toggle', label: 'Run a test immediately after creating' },
    ],
  };

  static everyLabel(minutes) {
    const hit = ScheduledTaskForm.EVERY_OPTIONS.find((o) => o.value === String(minutes));
    return hit ? hit.label.toLowerCase() : 'every ' + minutes + ' minutes';
  }

  static openingTurn(data) {
    const lines = ['(Setup form submitted)'];
    lines.push('Task: ' + String(data.prompt).trim());
    if (data.title && String(data.title).trim()) lines.push('Name: ' + String(data.title).trim());
    lines.push('Schedule: ' + ScheduledTaskForm.everyLabel(data.everyMinutes || 60));
    lines.push('Run a test after creating: ' + (data.runTest === false ? 'no' : 'yes'));
    return lines.join('\n');
  }
}
