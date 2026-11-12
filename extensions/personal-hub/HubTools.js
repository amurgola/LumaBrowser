class HubTools {
  static NOT_ACTIVE = 'The Hub is not active';
  static DEFAULT_THREAD_LIMIT = 50;
  static OVERVIEW_ACTIVITY_LIMIT = 200;
  static OVERVIEW_NOTABLE = 10;
  static THREAD_STATES = { active: 'active', dismissed: 'done', all: 'all' };
  static DEFAULT_NOTIFICATION_LIMIT = 100;

  static TOOLS = [
    {
      name: 'hub_overview',
      description: 'A compact snapshot of the user\'s day: what reached them today (activity by app and kind, the latest and the high-priority items), task counts per board column, today\'s calendar events, sync health, and any persisted tab or token that lost its sign-in. The activity is background about their day, not a list of unread things. Call this first when asked "what\'s on my plate".',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'hub_focus',
      description: 'The distilled answer to "what should I be doing": the task the user said they are working on, the short list of what needs them (overdue and due-today tasks, contexts where someone is waiting on them, items marked high or urgent) and the calendar now and next.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'hub_set_focus_task',
      description: 'Set the task the user is working on now (shown at the top of their Focus view), or clear it with an empty id. Only when the user says what they are working on.',
      mutating: true,
      inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Task id (task_...), empty to clear' } } },
    },
    {
      name: 'hub_list_summaries',
      description: 'The activity feed distilled by context (a company or area of the user\'s life): one card each with a headline, a short summary, whether someone is waiting on the user and why, and the items behind it. Use this before hub_list_threads to understand what is going on.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'hub_list_contexts',
      description: 'The user\'s contexts (companies or areas of life) with the rules that file accounts, tabs, calendars and trackers under each.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'hub_list_contacts',
      description: 'The people the Hub has seen in the user\'s activity: each contact with every way they appear (app, name or address, context), plus pairs that may be the same person. Use it to recognise that a Slack name and a mail sender are one person.',
      inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Part of a name, address or app' }, limit: { type: 'number' } } },
    },
    {
      name: 'hub_merge_contacts',
      description: 'Record that two contacts are the same person: everything `fromId` goes by moves to `intoId`. Only when the user confirms it.',
      mutating: true,
      inputSchema: { type: 'object', properties: { intoId: { type: 'string' }, fromId: { type: 'string' } }, required: ['intoId', 'fromId'] },
    },
    {
      name: 'hub_snapshot_thread',
      description: 'Read the conversation behind an activity item from the user\'s own signed-in tab (more than the notification\'s one line) and keep it. Replies with the text, or the reason nothing could be read (the tab is showing something else, or is not open). Use before judging whether an item needs the user.',
      inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Thread id (thr_...)' }, force: { type: 'boolean', description: 'Read again even when a snapshot of the latest activity exists' } }, required: ['id'] },
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
      description: 'The activity feed: what reached the user, newest first. Each item rolls up the notifications of one chat conversation, mail thread, calendar or task notice (intercepted from Slack, Teams, Gmail, Outlook, Messages, ClickUp and other sites, plus items an automation pushed) and carries its kind (chat, mail, calendar, task, other). It is context about the user\'s day: nothing in it is unread or waiting to be cleared.',
      inputSchema: {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['active', 'dismissed', 'all'], description: 'Default active: everything the user has not dismissed from the feed' },
          app: { type: 'string', description: 'Only this app (slack, teams, gmail, outlook, messages, clickup, proton, ...)' },
          since: { type: 'string', description: 'ISO time; only items with activity at or after it (for "today", the start of the day)' },
          limit: { type: 'number', description: 'Max items (default 50)' },
        },
      },
    },
    {
      name: 'hub_get_thread',
      description: 'One activity item with the notifications behind it (newest first).',
      inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Thread id (thr_...)' } }, required: ['id'] },
    },
    {
      name: 'hub_set_thread_state',
      description: 'Dismiss an activity item from the feed (done) or put it back (open). Only when the user asks: items do not need clearing, and new activity brings a dismissed item back.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Thread id' },
          state: { type: 'string', enum: ['open', 'done'], description: 'done dismisses, open restores' },
        },
        required: ['id', 'state'],
      },
    },
    {
      name: 'hub_enrich_thread',
      description: 'Attach your contextual understanding to an activity item: a summary, priority, labels, its kind, a better title, structured context. Creates the item when app + threadKey name one that does not exist yet.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Thread id (or give app + threadKey)' },
          app: { type: 'string' },
          threadKey: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string', description: 'One or two sentences: what this item is about and, if anything, what is being asked of the user' },
          kind: { type: 'string', enum: ['chat', 'mail', 'calendar', 'task', 'other'], description: 'What the item is, when the app alone does not say' },
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
          beforeId: { type: 'string', description: 'Place it before this task in the column (also reorders within its own column); omit to land at the end' },
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
      description: 'Link an activity item to an existing board task (empty taskId unlinks).',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: { threadId: { type: 'string' }, taskId: { type: 'string' } },
        required: ['threadId'],
      },
    },
    {
      name: 'hub_thread_to_task',
      description: 'Turn an activity item into a board task (title and description from the item) and link the two in one step. An item that already has a task answers that task instead of making another.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          threadId: { type: 'string' },
          columnKey: { type: 'string', description: 'Default: the first column' },
          sourceId: { type: 'string', description: 'A task source id to create it in that ClickUp workspace; omit for a local task' },
          listId: { type: 'string', description: 'One of the source\'s imported list ids; default its first list' },
          status: { type: 'string', description: 'A status of that list, when the reply asked for one' },
        },
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
    hub_focus: (api) => ({ success: true, ...api.getFocus() }),
    hub_set_focus_task: (api, args) => ({ success: true, ...api.setFocusTask(args.id || null) }),
    hub_list_summaries: (api) => ({ success: true, ...HubTools._summaries(api.listSummaries()) }),
    hub_list_contexts: (api) => ({ success: true, contexts: api.listContexts() }),
    hub_list_contacts: (api, args) => ({ success: true, ...api.listContacts({ query: args.query || '', limit: args.limit || 50 }) }),
    hub_merge_contacts: (api, args) => ({ success: true, contact: api.mergeContacts(args.intoId, args.fromId) }),
    hub_snapshot_thread: async (api, args) => {
      const result = await api.snapshotThread(args.id, { force: !!args.force });
      return result.snapshot ? { success: true, ...result } : { success: false, error: result.reason || 'Nothing could be read.' };
    },
    hub_list_events: (api, args) => ({ success: true, events: api.listEvents(HubTools._eventWindow(args)) }),
    hub_list_threads: (api, args) => ({ success: true, threads: api.listThreads({ state: HubTools._threadState(args.state), app: args.app || null, since: args.since || null, limit: args.limit || HubTools.DEFAULT_THREAD_LIMIT }) }),
    hub_get_thread: (api, args) => HubTools._found(api.getThread(args.id), 'Thread not found'),
    hub_set_thread_state: (api, args) => ({ success: true, thread: api.setThreadState(args.id, args.state, { snoozeUntil: args.snoozeUntil }) }),
    hub_enrich_thread: (api, args) => HubTools._enrich(api, args),
    hub_list_columns: (api) => ({ success: true, columns: api.listColumns() }),
    hub_list_tasks: (api, args) => ({ success: true, tasks: api.listTasks({ columnKey: args.columnKey || null, sourceId: args.sourceId || null, includeArchived: !!args.includeArchived, includeHidden: !!args.includeHidden }) }),
    hub_get_task: (api, args) => HubTools._found(api.getTask(args.id), 'Task not found'),
    hub_create_task: async (api, args) => HubTools._created(await api.createTask(args)),
    hub_update_task: async (api, args) => ({ success: true, ...(await api.updateTask(args.id, HubTools._without(args, 'id'))) }),
    hub_move_task: async (api, args) => ({ success: true, ...(await api.moveTask(args.id, args.columnKey, HubTools._moveOptions(args))) }),
    hub_link_status: (api, args) => (args.newColumn
      ? { success: true, column: api.addStatusColumn(args.status) }
      : { success: true, ...api.linkStatus(args.status, args.columnKey) }),
    hub_hide_tasks: (api, args) => ({ success: true, changed: api.setTasksHidden(args.ids || [], args.hidden !== false) }),
    hub_add_task_message: async (api, args) => ({ success: true, ...(await api.addTaskMessage(args.id, args.body, { author: 'agent' })) }),
    hub_link_thread_task: (api, args) => ({ success: true, thread: api.linkThreadToTask(args.threadId, args.taskId || null) }),
    hub_thread_to_task: async (api, args) => HubTools._toTask(await api.threadToTask(args.threadId, HubTools._without(args, 'threadId'))),
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
    const columns = api.listColumns();
    const tasks = api.listTasks({});
    const perColumn = columns.map((c) => ({ key: c.key, title: c.title, count: tasks.filter((t) => t.columnKey === c.key).length }));
    return {
      success: true,
      activityToday: HubTools._activityToday(api),
      tasksByColumn: perColumn,
      todayEvents: api.listEvents({ days: 1 }),
      sync: HubTools._syncSummary(api.syncStatus()),
      signInsNeedingAttention: HubTools._attention(api),
    };
  }

  static _activityToday(api) {
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const items = api.listThreads({ state: 'active', since, limit: HubTools.OVERVIEW_ACTIVITY_LIMIT }) || [];
    const byApp = {};
    const byKind = {};
    for (const t of items) {
      byApp[t.app] = (byApp[t.app] || 0) + 1;
      const kind = t.kind || 'other';
      byKind[kind] = (byKind[kind] || 0) + 1;
    }
    const brief = (t) => ({ id: t.id, app: t.app, kind: t.kind || 'other', title: t.title, lastAt: t.lastAt, priority: t.priority, summary: t.summary, taskId: t.taskId || null });
    const notable = (t) => t.priority === 'high' || t.priority === 'urgent';
    return {
      items: items.length,
      byApp,
      byKind,
      latest: items.slice(0, HubTools.OVERVIEW_NOTABLE).map(brief),
      highPriority: items.filter(notable).slice(0, HubTools.OVERVIEW_NOTABLE).map(brief),
    };
  }

  static _summaries(listed) {
    const cards = ((listed && listed.cards) || []).map((card) => ({
      ...card,
      items: (card.items || []).map((t) => ({ id: t.id, app: t.app, kind: t.kind, title: t.title, lastAt: t.lastAt, priority: t.priority, taskId: t.taskId || null })),
    }));
    return { cards, status: (listed && listed.status) || {} };
  }

  static _threadState(state) {
    if (!state) return 'active';
    return HubTools.THREAD_STATES[state] || state;
  }

  static _moveOptions(args) {
    const opts = args.status ? { status: args.status } : {};
    if (args.beforeId) opts.beforeId = args.beforeId;
    return opts;
  }

  static _toTask(result) {
    if (result && result.needsStatus) return { success: false, error: `Column "${result.column.title}" has no linked status in that list; call again with status.`, ...result };
    return { success: true, ...result };
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
