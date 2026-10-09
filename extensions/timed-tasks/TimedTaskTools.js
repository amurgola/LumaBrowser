class TimedTaskTools {
  static NOT_ACTIVE = 'Timed Tasks is not active';
  static DEFAULT_RUN_LIMIT = 10;

  static TOOLS = [
    {
      name: 'timed_tasks_list',
      description: 'List all timed AI tasks with their schedule, state (active, paused, running), last run, next run, and last error',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'timed_tasks_create',
      description: 'Create a new timed AI task that runs a prompt at a recurring interval',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Task name' },
          requestPrompt: { type: 'string', description: 'The prompt to send to the LLM each run' },
          responsePrompt: { type: 'string', description: 'Optional JSON schema or template for the final response. If set, the agent returns exactly this shape with values filled in, for example {"rate": ""}.' },
          repeatInterval: { type: 'number', description: 'Interval in milliseconds between runs (default 3600000, one hour)' },
          webhookUrl: { type: 'string', description: 'Optional webhook URL to POST results to' },
        },
        required: ['name', 'requestPrompt'],
      },
    },
    {
      name: 'timed_tasks_set_paused',
      description: 'Pause or resume a timed AI task',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' },
          paused: { type: 'boolean', description: 'true to pause, false to resume' },
        },
        required: ['id', 'paused'],
      },
    },
    {
      name: 'timed_tasks_delete',
      description: 'Delete a timed AI task and all of its run history',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'timed_tasks_trigger',
      description: 'Run a timed AI task immediately and return the result',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'timed_tasks_get_runs',
      description: 'Get recent runs (status, response, timing) for a timed AI task',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' },
          limit: { type: 'number', description: 'Maximum number of runs to return (default 10)' },
        },
        required: ['id'],
      },
    },
  ];

  static HANDLERS = {
    timed_tasks_list: (api) => ({ success: true, tasks: api.getAllTasks() }),
    timed_tasks_create: async (api, args) => ({ success: true, task: await api.createTask(args) }),
    timed_tasks_set_paused: (api, args) => TimedTaskTools._setPaused(api, args),
    timed_tasks_delete: (api, args) => TimedTaskTools._delete(api, args),
    timed_tasks_trigger: async (api, args) => ({ success: true, ...(await api.triggerNow(args.id, { silent: true })) }),
    timed_tasks_get_runs: (api, args) => ({ success: true, runs: api.getTaskRuns(args.id, args.limit || TimedTaskTools.DEFAULT_RUN_LIMIT, 0) }),
  };

  static async handle(api, toolName, args = {}) {
    if (!api) throw new Error(TimedTaskTools.NOT_ACTIVE);
    const run = TimedTaskTools.HANDLERS[toolName];
    if (!run) throw new Error(`Unknown timed_tasks tool: ${toolName}`);
    return run(api, args);
  }

  static _setPaused(api, args) {
    const task = api.setEnabled(args.id, !args.paused);
    if (!task) return { success: false, error: 'Task not found' };
    return { success: true, task };
  }

  static _delete(api, args) {
    const result = api.deleteTask(args.id);
    return { success: !!(result && result.changes > 0) };
  }
}

module.exports = TimedTaskTools;
