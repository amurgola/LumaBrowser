module.exports = {
  id: 'personal-hub',
  name: 'Hub',
  version: '1.0.0',
  description: 'Consolidates calendars, chat and mail notifications and tasks from every workspace into one board, with hub_* tools for agents',

  dependencies: {
    required: {
      'core:database': {
        tables: [
          { name: 'hub_calendar_sources' },
          { name: 'hub_calendar_events' },
          { name: 'hub_notifications' },
          { name: 'hub_threads' },
          { name: 'hub_board_columns' },
          { name: 'hub_task_sources' },
          { name: 'hub_tasks' },
          { name: 'hub_task_messages' },
        ],
      },
    },
    optional: {
      'core:browser': {
        reason: 'Read calendars through the signed-in persisted tabs, watch those tabs for sign-outs, and open sign-in and "open in app" links in a real tab',
      },
      'ext:notification-interceptor': {
        reason: 'Every intercepted web notification feeds the conversation queue',
      },
    },
  },

  settings: {
    label: 'Hub',
    tabId: 'personal-hub',
    placement: 'tab',
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/hub',
  },

  mcpTools: {
    file: './mcp-tools.js',
  },

  dashboard: {
    widgets: [
      { id: 'board', title: 'Task board', file: './ui/widgets/HubBoardWidget.js', w: 8, h: 5, context: 'widgetContext' },
      { id: 'agenda', title: 'Agenda', file: './ui/widgets/HubAgendaWidget.js', w: 4, h: 5, context: 'widgetContext' },
      { id: 'inbox', title: 'Conversation queue', file: './ui/widgets/HubInboxWidget.js', w: 4, h: 5, context: 'widgetContext' },
    ],
    assets: [
      './ui/widgets/HubWidgetBase.js',
      './ui/widgets/HubWidgetStyles.js',
      './ui/widgets/WidgetDom.js',
      './ui/widgets/HubTaskDetail.js',
      './ui/widgets/TaskChrome.js',
      './ui/widgets/StatusPicker.js',
    ],
    api: [
      'listEvents', 'listCalendarSources',
      'listThreads', 'getThread', 'setThreadState', 'linkThreadToTask',
      'listColumns', 'listTasks', 'getTask', 'createTask', 'updateTask', 'moveTask', 'listTaskMessages', 'addTaskMessage',
      'listTaskTargets', 'setTasksHidden', 'linkStatus', 'addStatusColumn',
      'listTaskSources', 'syncNow', 'syncStatus', 'openUrl',
      'listConnections', 'showConnectionTab',
    ],
  },
};
