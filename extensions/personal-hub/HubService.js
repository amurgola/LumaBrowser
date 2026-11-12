const HubContext = require('./HubContext');

class HubService {
  static SIGN_IN_URLS = { google: 'https://calendar.google.com/calendar/u/0/r', microsoft: 'https://teams.cloud.microsoft/' };

  constructor({ calendar, inbox, board, sync, inbound, openUrl, connections = null, contexts = null, summarizer = null, focus = null, contacts = null, reader = null, now = () => new Date() }) {
    this._now = now;
    this._contacts = contacts;
    this._reader = reader;
    this._contexts = contexts;
    this._summarizer = summarizer;
    this._focus = focus;
    this._calendar = calendar;
    this._inbox = inbox;
    this._board = board;
    this._sync = sync;
    this._inbound = inbound;
    this._openUrl = typeof openUrl === 'function' ? openUrl : async () => ({ success: false, error: 'The browser is not available.' });
    this._connections = connections;
    this._toTask = new Map();
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
  listThreads(query) {
    const items = this._inbox.listThreads(query || {});
    if (!this._contexts) return items;
    const contexts = this._contexts.list();
    return items.map((item) => ({ ...item, contextId: this._contexts.forItem(item, contexts) }));
  }
  getThread(id) { return this._inbox.getThread(id); }
  setThreadState(id, state, opts) { return this._inbox.setThreadState(id, state, opts || {}); }
  setThreadsState(ids, state) {
    let changed = 0;
    for (const id of Array.isArray(ids) ? ids : []) {
      if (this._inbox.setThreadState(id, state, {})) changed += 1;
    }
    return changed;
  }
  enrichThread(ref, enrichment) { return this._inbox.enrichThread(ref, enrichment); }
  pushQueueItem(item) { return this._inbox.pushItem(item); }
  linkThreadToTask(threadId, taskId) { return this._inbox.linkToTask(threadId, taskId); }
  threadToTask(threadId, opts) {
    const key = String(threadId || '');
    if (this._toTask.has(key)) return this._toTask.get(key);
    const work = this._threadToTask(key, opts || {}).finally(() => this._toTask.delete(key));
    this._toTask.set(key, work);
    return work;
  }

  async _threadToTask(threadId, { columnKey = null, sourceId = null, listId = null, status = null }) {
    const found = this._inbox.getThread(threadId);
    if (!found) throw new Error('Activity item not found.');
    const { thread, notifications } = found;
    const linked = thread.taskId ? this._board.getTask(thread.taskId) : null;
    if (linked && !linked.task.archived) return { task: linked.task, thread, created: false };
    const last = notifications[0] || {};
    const title = thread.title || last.title || (thread.participants || []).join(', ') || 'Follow up';
    const description = [thread.summary || last.body || '', thread.url].filter(Boolean).join('\n\n');
    const result = await this._board.createTask({ title, description, columnKey, sourceId, listId, status });
    if (result && result.needsStatus) return result;
    this._attachConversation(threadId, result.id, description);
    return { task: result, thread: this._inbox.linkToTask(threadId, result.id), created: true };
  }

  _attachConversation(threadId, taskId, description) {
    if (!this._reader || !this._reader.available()) return;
    this.snapshotThread(threadId).then(({ snapshot }) => {
      if (!snapshot || !snapshot.text) return null;
      return this._board.updateTask(taskId, { description: [description, `Conversation when this became a task:\n${snapshot.text}`].filter(Boolean).join('\n\n') });
    }).catch(() => {});
  }

  async snapshotThread(threadId, opts) {
    if (!this._reader) return { snapshot: null, reason: 'Snapshots are not available.' };
    const item = this._feedItem(threadId);
    if (!item) return { snapshot: null, reason: 'Activity item not found.' };
    return this._reader.read(item, { force: !!(opts && opts.force) });
  }

  _feedItem(threadId) {
    const found = this._inbox.getThread(threadId);
    if (!found) return null;
    const last = found.notifications[0] || null;
    const item = { ...found.thread, lastNotification: last ? { title: last.title, body: last.body, receivedAt: last.receivedAt, sender: last.sender, partition: last.partition || '', host: last.host || '', url: last.url || '' } : null };
    return { ...item, contextId: this._contexts ? this._contexts.forItem(item) : null };
  }

  listContacts(query) {
    if (!this._contacts) return { contacts: [], suggestions: [] };
    return { contacts: this._contacts.list(query || {}), suggestions: this._contacts.suggestions() };
  }
  mergeContacts(intoId, fromId) { return this._requireContacts().merge(intoId, fromId); }
  splitContactIdentity(identityId) { return this._requireContacts().split(identityId); }
  renameContact(id, name) { return this._requireContacts().rename(id, name); }
  keepContactsApart(aId, bId) { return this._requireContacts().notSame(aId, bId); }
  _requireContacts() {
    if (!this._contacts) throw new Error('Contacts are not available.');
    return this._contacts;
  }
  listNotifications(query) { return this._inbox.listNotifications(query || {}); }

  listContexts() { return this._contexts ? this._contexts.list() : []; }
  saveContexts(contexts) {
    if (!this._contexts) throw new Error('Contexts are not available.');
    const saved = this._contexts.save(contexts);
    if (this._summarizer) this._summarizer.schedule(0);
    return saved;
  }

  listSummaries() {
    if (!this._summarizer) return { cards: [], status: { enabled: false, available: false } };
    return { cards: this._summarizer.cards(), status: this._summarizer.status() };
  }
  summaryStatus() { return this._summarizer ? this._summarizer.status() : { enabled: false, available: false }; }
  summaryModels() { return this._summarizer ? this._summarizer.models() : { models: [], chosen: '' }; }
  setSummaryModel(value) {
    if (!this._summarizer) throw new Error('Summaries are not available.');
    return this._summarizer.setModel(value);
  }
  setSummariesEnabled(enabled) {
    if (!this._summarizer) throw new Error('Summaries are not available.');
    return this._summarizer.setEnabled(enabled);
  }
  async summarizeNow(opts) {
    if (!this._summarizer) throw new Error('Summaries are not available.');
    return this._summarizer.run({ force: !!(opts && opts.force) });
  }

  getFocus() { return this._focus ? this._focus.get() : { now: null, needs: [], more: 0, calendar: { current: null, next: null } }; }
  setFocusTask(taskId) {
    if (!this._focus) throw new Error('Focus is not available.');
    return this._focus.setTask(taskId || null);
  }

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
