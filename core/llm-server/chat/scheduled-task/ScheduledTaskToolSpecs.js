const TaskInterval = require('./TaskInterval');

class ScheduledTaskToolSpecs {
  static create() {
    const range = ScheduledTaskToolSpecs._range();
    return {
      name: 'create_scheduled_task',
      mutating: true,
      description: 'Create the scheduled task defined in this conversation and run an '
        + 'immediate test of it. Call ONLY after the user has confirmed the summary. '
        + '`prompt` is the complete, self-contained instruction each run executes; '
        + '`every_minutes` is the interval (' + range + '). Returns the created task '
        + 'and the test run\'s outcome. Fails if this conversation already has a task.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short human-readable task name, e.g. "US 30-year mortgage rate webhook"' },
          prompt: { type: 'string', description: 'The full self-contained instruction the background agent executes each run' },
          every_minutes: { type: 'number', description: `Run interval in minutes (${range})` },
          run_test: { type: 'boolean', description: 'Run an immediate test after creating (default true)' },
        },
        required: ['title', 'prompt', 'every_minutes'],
      },
    };
  }

  static update() {
    const range = ScheduledTaskToolSpecs._range();
    return {
      name: 'update_scheduled_task',
      mutating: true,
      description: 'Change this conversation\'s existing scheduled task: any of title, '
        + 'prompt (the full replacement instruction), every_minutes (' + range + '), or enabled '
        + '(false pauses the task, true resumes it). Pass run_test true to test the '
        + 'updated task immediately. Only pass the fields being changed.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'New task name' },
          prompt: { type: 'string', description: 'New full self-contained run instruction (replaces the old one entirely)' },
          every_minutes: { type: 'number', description: `New interval in minutes (${range})` },
          enabled: { type: 'boolean', description: 'false = pause the task, true = resume it' },
          run_test: { type: 'boolean', description: 'Run an immediate test after updating (default false)' },
        },
      },
    };
  }

  static run() {
    return {
      name: 'run_scheduled_task',
      mutating: true,
      description: 'Execute this conversation\'s scheduled task once, right now, and '
        + 'return the run\'s outcome. Use when the user asks to run or test the task '
        + 'immediately. Does not change the schedule; the run is recorded in the '
        + 'task\'s run history like any other.',
      inputSchema: { type: 'object', properties: {} },
    };
  }

  static _range() {
    return `${TaskInterval.MIN_EVERY_MINUTES}-${TaskInterval.MAX_EVERY_MINUTES}`;
  }
}

module.exports = ScheduledTaskToolSpecs;
