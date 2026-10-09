class HubTools {
  static NOT_ACTIVE = 'The Hub is not active';
  static DEFAULT_THREAD_LIMIT = 50;
  static DEFAULT_NOTIFICATION_LIMIT = 100;

  static TOOLS = [
    {
      name: 'hub_overview',
      description: 'A compact snapshot of the user\'s day: open conversation threads by app, task counts per board column, today\'s calendar events, sync health, and any persisted tab or token that lost its sign-in. Call this first when asked "what\'s on my plate".',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'hub_list_events',
      description: 'Calendar events across every connected calendar (Google, Microsoft 365, ICS feeds) for a window: default today, or `days` ahead, or an explicit from/to.',
      inputSchema: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'How many days from the start of today (default 1)' },
          from: { type: 'string', description: 'ISO start (overrides days)' },
          to: { type: 'string', description: 'ISO end (with from)' },
        },
      },
    },
    {
      name: 'hub_list_threads',
      description: 'The conversation queue: threads rolled up from intercepted Slack, Teams, Gmail, Outlook, Messages and ClickUp notifications, plus items an automation pushed. Default: open threads, newest activity first.',
      inputSchema: {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['open', 'reviewed', 'snoozed', 'done', 'all'], description: 'Default open' },
          app: { type: 'string', description: 'Only this app (slack, teams, gmail, outlook, messages, clickup, proton, ...)' },
          limit: { type: 'number', description: 'Max threads (default 50)' },
        },
      },
    },
    {
      name: 'hub_get_thread',
      description: 'One conversation thread with the notifications behind it (newest first).',
      inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Thread id (thr_...)' } }, required: ['id'] },
    },
    {
      name: 'hub_set_thread_state',
      description: 'Mark a thread reviewed, done, snoozed (until an ISO time, default 4 hours) or open again.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Thread id' },
          state: { type: 'string', enum: ['open', 'reviewed', 'snoozed', 'done'] },
          snoozeUntil: { type: 'string', description: 'ISO time, only for snoozed' },
        },
        required: ['id', 'state'],
      },
    },
    {
      name: 'hub_enrich_thread',
      description: 'Attach your contextual understanding to a thread: a summary, priority, labels, a better title, structured context. Creates the thread when app + threadKey name one that does not exist yet.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Thread id (or give app + threadKey)' },
          app: { type: 'string' },
          threadKey: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string', description: 'One or two sentences: what this thread is about and what is being asked of the user' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
          labels: { type: 'array', items: { type: 'string' } },
          context: { type: 'object', description: 'Any structured facts (merged into the existing context)' },
          taskId: { type: 'string', description: 'Link the thread to a board task' },
        },
      },
    },
    {
      name: 'hub_list_columns',
      description: 'The task board\'s columns (keys and titles) in order; tasks move between these.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'hub_list_tasks',
      description: 'Tasks on the unified board (local tasks and ClickUp tasks assigned to the user), optionally one column or one source.',
      inputSchema: {
        type: 'object',
        properties: {
          columnKey: { type: 'string', description: 'A column key from hub_list_columns' },
          sourceId: { type: 'string', description: 'A task source id (ClickUp workspace)' },
          includeArchived: { type: 'boolean' },
          includeHidden: { type: 'boolean', description: 'Also return tasks the user hid from the board' },
        },
      },
    },
    {
      name: 'hub_get_task',
      description: 'One task with its message thread and source.',
      inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Task id (task_...)' } }, required: ['id'] },
    },
    {
      name: 'hub_create_task',
      description: 'Create a task on the board: local, or with sourceId created in that ClickUp workspace too (assigned to the user).',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          columnKey: { type: 'string', description: 'Default: the first column' },
          sourceId: { type: 'string', description: 'A task source id from hub_sync_status; omit for a local task' },
          listId: { type: 'string', description: 'One of the source\'s imported list ids; default its first list' },
          status: { type: 'string', description: 'A status of that list, when the reply asked for one (it is linked to the column)' },
          priority: { type: 'string', description: 'low | normal | high | urgent' },
          dueAt: { type: 'string', description: 'ISO date or date-time' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title'],
      },
    },
    {
      name: 'hub_update_task',
      description: 'Edit a task\'s title, description, priority, due date or tags (pushed to ClickUp for imported tasks).',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string' },
          dueAt: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['id'],
      },
    },
    {
      name: 'hub_move_task',
      description: 'Move a task to another board column. For a ClickUp task the column\'s linked status is pushed; when the column has none in the task\'s list the reply has needsStatus and statuses, and nothing moves until you call again with status.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          columnKey: { type: 'string' },
          status: { type: 'string', description: 'A ClickUp status of the task\'s list; it is linked to the column' },
        },
        required: ['id', 'columnKey'],
      },
    },
    {
      name: 'hub_link_status',
      description: 'Link a ClickUp status that has no column (a pseudo column on the board) to a column, or with newColumn true make it a column of its own. Its tasks move there.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          columnKey: { type: 'string', description: 'The column to merge it into' },
          newColumn: { type: 'boolean', description: 'Create a column named after the status instead' },
        },
        required: ['status'],
      },
    },
    {
      name: 'hub_hide_tasks',
      description: 'Hide finished tasks from the board (or show them again with hidden false). Hidden tasks stay synced.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: { ids: { type: 'array', items: { type: 'string' } }, hidden: { type: 'boolean', description: 'Default true' } },
        required: ['ids'],
      },
    },
    {
      name: 'hub_add_task_message',
      description: 'Add a message to a task\'s thread; for a ClickUp task it is posted as a comment.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string' }, body: { type: 'string' } },
        required: ['id', 'body'],
      },
    },
    {
      name: 'hub_link_thread_task',
      description: 'Link a conversation thread to a board task (empty taskId unlinks).',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: { threadId: { type: 'string' }, taskId: { type: 'string' } },
        required: ['threadId'],
      },
    },
    {
      name: 'hub_list_notifications',
      description: 'The raw log of intercepted web notifications (every Slack, Teams, Gmail, Outlook, Messages, ClickUp... notification the browser captured), newest first. The Dashboard snapshot carries only today\'s; call this for earlier days or more of them.',
      inputSchema: {
        type: 'object',
        properties: {
          app: { type: 'string', description: 'Only this app (slack, teams, gmail, outlook, messages, clickup, proton, ...)' },
          since: { type: 'string', description: 'ISO time; only notifications received at or after it' },
          limit: { type: 'number', description: 'Max notifications (default 100)' },
          offset: { type: 'number', description: 'Skip this many (paging)' },
        },
      },
    },
    {
      name: 'hub_sync_now',
      description: 'Sync calendars and task sources now (all, one kind, or one source id) and report each outcome.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['all', 'calendar', 'tasks'] },
          sourceId: { type: 'string' },
        },
      },
    },
    {
      name: 'hub_sync_status',
      description: 'Every calendar and task source with its last sync time, status and error.',
      inputSchema: { type: 'object', properties: {} },
    },
  ];

  static HANDLERS = {
    hub_overview: (api) => HubTools._overview(api),
    hub_list_events: (api, args) => ({ success: true, events: api.listEvents(HubTools._eventWindow(args)) }),
    hub_list_threads: (api, args) => ({ success: true, threads: api.listThreads({ state: args.state || 'open', app: args.app || null, limit: args.limit || HubTools.DEFAULT_THREAD_LIMIT }) }),
    hub_get_thread: (api, args) => HubTools._found(api.getThread(args.id), 'Thread not found'),
    hub_set_thread_state: (api, args) => ({ success: true, thread: api.setThreadState(args.id, args.state, { snoozeUntil: args.snoozeUntil }) }),
    hub_enrich_thread: (api, args) => HubTools._enrich(api, args),
    hub_list_columns: (api) => ({ success: true, columns: api.listColumns() }),
    hub_list_tasks: (api, args) => ({ success: true, tasks: api.listTasks({ columnKey: args.columnKey || null, sourceId: args.sourceId || null, includeArchived: !!args.includeArchived, includeHidden: !!args.includeHidden }) }),
    hub_get_task: (api, args) => HubTools._found(api.getTask(args.id), 'Task not found'),
    hub_create_task: async (api, args) => HubTools._created(await api.createTask(args)),
    hub_update_task: async (api, args) => ({ success: true, ...(await api.updateTask(args.id, HubTools._without(args, 'id'))) }),
    hub_move_task: async (api, args) => ({ success: true, ...(await api.moveTask(args.id, args.columnKey, args.status ? { status: args.status } : {})) }),
    hub_link_status: (api, args) => (args.newColumn
      ? { success: true, column: api.addStatusColumn(args.status) }
      : { success: true, ...api.linkStatus(args.status, args.columnKey) }),
    hub_hide_tasks: (api, args) => ({ success: true, changed: api.setTasksHidden(args.ids || [], args.hidden !== false) }),
    hub_add_task_message: async (api, args) => ({ success: true, ...(await api.addTaskMessage(args.id, args.body, { author: 'agent' })) }),
    hub_link_thread_task: (api, args) => ({ success: true, thread: api.linkThreadToTask(args.threadId, args.taskId || null) }),
    hub_list_notifications: (api, args) => ({ success: true, notifications: api.listNotifications({ app: args.app || null, since: args.since || null, limit: args.limit || HubTools.DEFAULT_NOTIFICATION_LIMIT, offset: args.offset || 0 }) }),
    hub_sync_now: (api, args) => api.syncNow({ kind: args.kind || 'all', sourceId: args.sourceId || null }),
    hub_sync_status: (api) => ({ success: true, status: api.syncStatus() }),
  };

  static async handle(api, toolName, args = {}) {
    if (!api) throw new Error(HubTools.NOT_ACTIVE);
    const run = HubTools.HANDLERS[toolName];
    if (!run) throw new Error(`Unknown hub tool: ${toolName}`);
    return run(api, args || {});
  }

  static _overview(api) {
    const threads = api.listThreads({ state: 'open', limit: 200 });
    const byApp = {};
    for (const t of threads) byApp[t.app] = (byApp[t.app] || 0) + 1;
    const columns = api.listColumns();
    const tasks = api.listTasks({});
    const perColumn = columns.map((c) => ({ key: c.key, title: c.title, count: tasks.filter((t) => t.columnKey === c.key).length }));
    const urgent = threads.filter((t) => t.priority === 'high' || t.priority === 'urgent').slice(0, 10);
    return {
      success: true,
      openThreads: threads.length,
      threadsByApp: byApp,
      attentionThreads: urgent.map((t) => ({ id: t.id, app: t.app, title: t.title, priority: t.priority, summary: t.summary })),
      tasksByColumn: perColumn,
      todayEvents: api.listEvents({ days: 1 }),
      sync: HubTools._syncSummary(api.syncStatus()),
      signInsNeedingAttention: HubTools._attention(api),
    };
  }

  static _attention(api) {
    if (typeof api.listConnections !== 'function') return [];
    const { connections } = api.listConnections() || {};
    return (connections || []).filter((c) => c.needsAttention || c.status === 'missing')
      .map((c) => ({ app: c.appLabel, title: c.title, status: c.status, detail: c.detail }));
  }

  static _syncSummary(status) {
    const brief = (s) => ({ id: s.id, label: s.label, kind: s.kind, lastSyncAt: s.lastSyncAt, lastStatus: s.lastStatus, lastError: s.lastError });
    return { running: !!status.running, calendars: (status.calendars || []).map(brief), tasks: (status.tasks || []).map(brief) };
  }

  static _eventWindow(args) {
    if (args.from) return { from: args.from, to: args.to || null };
    return { days: args.days || 1 };
  }

  static _enrich(api, args) {
    const ref = args.id ? { id: args.id } : { app: args.app, threadKey: args.threadKey };
    if (!ref.id && !(ref.app && ref.threadKey)) return { success: false, error: 'Give a thread id, or app and threadKey.' };
    const enrichment = HubTools._without(args, 'id', 'app', 'threadKey');
    return { success: true, thread: api.enrichThread(ref, enrichment) };
  }

  static _created(result) {
    if (result && result.needsStatus) return { success: false, error: `Column "${result.column.title}" has no linked status in that list; call again with status.`, ...result };
    return { success: true, task: result };
  }

  static _found(value, missing) {
    return value ? { success: true, ...value } : { success: false, error: missing };
  }

  static _without(obj, ...keys) {
    const out = { ...obj };
    for (const key of keys) delete out[key];
    return out;
  }
}

module.exports = HubTools;
