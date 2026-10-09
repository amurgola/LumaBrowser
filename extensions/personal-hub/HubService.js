const HubContext = require('./HubContext');

class HubService {
  static SIGN_IN_URLS = { google: 'https://calendar.google.com/calendar/u/0/r', microsoft: 'https://teams.cloud.microsoft/' };

  constructor({ calendar, inbox, board, sync, inbound, openUrl, connections = null, now = () => new Date() }) {
    this._now = now;
    this._calendar = calendar;
    this._inbox = inbox;
    this._board = board;
    this._sync = sync;
    this._inbound = inbound;
    this._openUrl = typeof openUrl === 'function' ? openUrl : async () => ({ success: false, error: 'The browser is not available.' });
    this._connections = connections;
  }

  listCalendarSources() { return this._calendar.listSources(); }
  addCalendarSource(input) { return this._calendar.addSource(input); }
  updateCalendarSource(id, patch) { return this._calendar.updateSource(id, patch); }
  removeCalendarSource(id) { return this._calendar.removeSource(id); }
  listEvents(query) { return this._calendar.listEvents(query || {}); }
  startOAuth(sourceId) { return this._calendar.startOAuth(sourceId); }
  completeOAuth(state, code, error) { return this._calendar.completeOAuth(state, code, error); }

  listConnections() { return this._connections ? this._connections.monitor.list() : { checkedAt: null, connections: [] }; }
  checkConnections() { return this._connections ? this._connections.monitor.check() : this.listConnections(); }
  showConnectionTab(key) { return this._connections ? this._connections.monitor.show(key) : { success: false, error: 'The browser is not available.' }; }
  async openSignInTab(provider) {
    const url = HubService.SIGN_IN_URLS[provider];
    if (!url) return { success: false, error: `Unknown provider "${provider}"` };
    if (!this._connections) return { success: false, error: 'The browser is not available.' };
    return this._connections.tabs.openPersisted(url);
  }
  listAccountCalendars() { return this._connections ? this._connections.accounts.list() : []; }
  setAccountCalendar(input) {
    if (!this._connections) throw new Error('The browser is not available.');
    return this._connections.accounts.set(input || {});
  }

  ingestNotification(notification, tab) { return this._inbox.ingest(notification, tab); }
  listThreads(query) { return this._inbox.listThreads(query || {}); }
  getThread(id) { return this._inbox.getThread(id); }
  setThreadState(id, state, opts) { return this._inbox.setThreadState(id, state, opts || {}); }
  enrichThread(ref, enrichment) { return this._inbox.enrichThread(ref, enrichment); }
  pushQueueItem(item) { return this._inbox.pushItem(item); }
  linkThreadToTask(threadId, taskId) { return this._inbox.linkToTask(threadId, taskId); }
  listNotifications(query) { return this._inbox.listNotifications(query || {}); }

  listColumns() { return this._board.listColumns(); }
  saveColumns(columns) { return this._board.saveColumns(columns); }
  listTasks(query) { return this._board.listTasks(query || {}); }
  getTask(id) { return this._board.getTask(id); }
  createTask(input) { return this._board.createTask(input || {}); }
  listTaskTargets() { return this._board.listTaskTargets(); }
  setTasksHidden(ids, hidden) { return this._board.setTasksHidden(ids, hidden !== false); }
  updateTask(id, patch) { return this._board.updateTask(id, patch || {}); }
  moveTask(id, columnKey, opts) { return this._board.moveTask(id, columnKey, opts || {}); }
  linkStatus(status, columnKey) { return this._board.linkStatus(status, columnKey); }
  addStatusColumn(status) { return this._board.addStatusColumn(status); }
  resetStatusLinks(sourceId) { return this._board.resetStatusLinks(sourceId); }
  archiveTask(id) { return this._board.archiveTask(id); }
  listTaskMessages(taskId) { return this._board.listMessages(taskId); }
  addTaskMessage(taskId, body, opts) { return this._board.addMessage(taskId, body, opts || {}); }
  listTaskSources() { return this._board.listSources(); }
  addTaskSource(input) { return this._board.addSource(input); }
  updateTaskSource(id, patch) { return this._board.updateSource(id, patch); }
  removeTaskSource(id) { return this._board.removeSource(id); }
  discoverTaskSource(input) { return this._board.discover(input || {}); }

  syncNow(opts) { return this._sync.syncNow(opts || {}); }
  syncStatus() { return this._sync.status(); }

  getInboundToken() { return this._inbound.get(); }
  rotateInboundToken() { return this._inbound.rotate(); }

  widgetContext({ widgetId } = {}) { return HubContext.render(this, widgetId, { now: this._now() }); }

  openUrl(url) { return this._openUrl(url); }
}

module.exports = HubService;
