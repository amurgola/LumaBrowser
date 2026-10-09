const ClickUpClient = require('./ClickUpClient');
const TaskProvider = require('./TaskProvider');

class ClickUpTaskProvider extends TaskProvider {
  static KIND = 'clickup';
  static ME = 'me';
  static SCOPE_MINE = 'mine';
  static SCOPE_UNASSIGNED = 'mine-or-unassigned';
  static SCOPE_ALL = 'all';
  static SCOPES = [ClickUpTaskProvider.SCOPE_MINE, ClickUpTaskProvider.SCOPE_UNASSIGNED, ClickUpTaskProvider.SCOPE_ALL];

  constructor({ clientFactory = null } = {}) {
    super();
    this._clientFactory = clientFactory || ((opts) => new ClickUpClient(opts));
  }

  validateConfig(config) {
    const listIds = config && config.listIds;
    if (!Array.isArray(listIds) || !listIds.length) return 'Pick at least one ClickUp list to import from.';
    if (!listIds.every((id) => typeof id === 'string' && id.trim())) return 'Every ClickUp list id must be a non-empty string.';
    const scopes = Object.values((config && config.listScopes) || {});
    if (!scopes.every((s) => ClickUpTaskProvider.SCOPES.includes(s))) return `A list scope must be one of ${ClickUpTaskProvider.SCOPES.join(', ')}.`;
    return null;
  }

  async discover({ token, fetchImpl } = {}) {
    const client = this._client(token, fetchImpl);
    const user = await client.me();
    const teams = [];
    for (const team of await client.teams()) teams.push(await this._discoverTeam(client, team));
    return { user, teams };
  }

  async resolveAssignee({ token, config, fetchImpl } = {}) {
    const client = this._client(token, fetchImpl);
    const wanted = String((config && config.assignee) || ClickUpTaskProvider.ME).trim();
    if (!wanted || wanted.toLowerCase() === ClickUpTaskProvider.ME) return (await client.me()).id;
    return this._matchMember(client, (config && config.listIds) || [], wanted.toLowerCase());
  }

  async fetchTasks(source, { token, fetchImpl, shouldFetchComments = () => false } = {}) {
    const client = this._client(token, fetchImpl);
    const config = (source && source.config) || {};
    const me = config.assigneeId ? String(config.assigneeId) : null;
    const tasks = [];
    for (const listId of config.listIds || []) {
      const scope = ClickUpTaskProvider.scopeOf(config, listId);
      const assigneeIds = scope === ClickUpTaskProvider.SCOPE_MINE && me ? [me] : [];
      const remote = await client.listTasks(listId, { assigneeIds, includeClosed: !!config.includeClosed, subtasks: true });
      for (const task of remote) {
        if (ClickUpTaskProvider._inScope(task, scope, me)) tasks.push(await this._mapTask(client, task, shouldFetchComments));
      }
    }
    return tasks;
  }

  static scopeOf(config, listId) {
    const scope = config && config.listScopes ? config.listScopes[listId] : null;
    return ClickUpTaskProvider.SCOPES.includes(scope) ? scope : ClickUpTaskProvider.SCOPE_MINE;
  }

  static _inScope(task, scope, me) {
    if (scope !== ClickUpTaskProvider.SCOPE_UNASSIGNED) return true;
    const assignees = (task.assignees || []).map((a) => String(a.id));
    return !assignees.length || (!!me && assignees.includes(me));
  }

  async describeLists({ token, listIds = [], fetchImpl } = {}) {
    const client = this._client(token, fetchImpl);
    const lists = [];
    for (const id of listIds) lists.push(ClickUpTaskProvider._describedList(await client.list(id), id));
    return lists;
  }

  async createTask({ token, listId, fields = {}, fetchImpl } = {}) {
    const body = { name: String(fields.title || '') };
    if (fields.description) body.description = String(fields.description);
    if (fields.status) body.status = String(fields.status);
    if (fields.assigneeId) body.assignees = [Number(fields.assigneeId) || fields.assigneeId];
    const created = await this._client(token, fetchImpl).createTask(listId, body);
    const mapped = ClickUpTaskProvider._mapFields(created);
    if (!mapped.listId) mapped.listId = String(listId);
    mapped.comments = null;
    return mapped;
  }

  async pushStatus({ token, remoteId, status, fetchImpl } = {}) {
    await this._client(token, fetchImpl).updateTask(remoteId, { status: String(status) });
  }

  async postComment({ token, remoteId, text, fetchImpl } = {}) {
    const result = await this._client(token, fetchImpl).postComment(remoteId, text);
    return { remoteId: result && result.id != null ? String(result.id) : null };
  }

  async pushFields({ token, remoteId, fields, fetchImpl } = {}) {
    const body = {};
    if (fields && fields.title !== undefined) body.name = String(fields.title);
    if (fields && fields.description !== undefined) body.description = String(fields.description);
    if (!Object.keys(body).length) return;
    await this._client(token, fetchImpl).updateTask(remoteId, body);
  }

  _client(token, fetchImpl) {
    return this._clientFactory({ token, fetchImpl });
  }

  async _discoverTeam(client, team) {
    const spaces = [];
    for (const space of await client.spaces(team.id)) spaces.push(await this._discoverSpace(client, space));
    return { id: String(team.id), name: team.name || '', spaces };
  }

  async _discoverSpace(client, space) {
    const lists = [];
    for (const folder of await client.folders(space.id)) {
      for (const list of await client.folderLists(folder.id)) lists.push(ClickUpTaskProvider._discoveredList(list, folder.name || null));
    }
    for (const list of await client.folderlessLists(space.id)) lists.push(ClickUpTaskProvider._discoveredList(list, null));
    return { id: String(space.id), name: space.name || '', lists };
  }

  static _discoveredList(list, folderName) {
    return {
      id: String(list.id),
      name: list.name || '',
      folder: folderName,
      statuses: Array.isArray(list.statuses) ? list.statuses.map((s) => s.status).filter(Boolean) : [],
    };
  }

  static _describedList(list, fallbackId) {
    return {
      id: String((list && list.id) || fallbackId),
      name: (list && list.name) || '',
      statuses: Array.isArray(list && list.statuses)
        ? list.statuses.filter((s) => s && s.status).map((s) => ({ status: s.status, type: s.type || '', color: s.color || '' }))
        : [],
    };
  }

  async _matchMember(client, listIds, wanted) {
    for (const listId of listIds) {
      for (const member of await client.listMembers(listId)) {
        const username = String(member.username || '').toLowerCase();
        const email = String(member.email || '').toLowerCase();
        if (username === wanted || email === wanted) return String(member.id);
      }
    }
    return null;
  }

  async _mapTask(client, task, shouldFetchComments) {
    const mapped = ClickUpTaskProvider._mapFields(task);
    mapped.comments = shouldFetchComments(mapped) ? (await client.taskComments(task.id)).map(ClickUpTaskProvider._mapComment) : null;
    return mapped;
  }

  static _mapFields(task) {
    const status = task.status || {};
    const folder = task.folder || {};
    return {
      remoteId: String(task.id),
      title: task.name || '',
      description: task.description || task.text_content || '',
      status: status.status || '',
      statusType: status.type || '',
      statusColor: status.color || '',
      priority: task.priority && task.priority.priority ? String(task.priority.priority) : '',
      dueAt: ClickUpTaskProvider._msToIso(task.due_date),
      url: task.url || '',
      listId: task.list && task.list.id != null ? String(task.list.id) : '',
      listName: (task.list && task.list.name) || '',
      spaceName: folder.hidden === false && folder.name ? folder.name : '',
      assignees: (task.assignees || []).map((a) => ({ id: String(a.id), name: a.username || a.email || '' })),
      tags: (task.tags || []).map((t) => t.name).filter(Boolean),
      remoteUpdatedAt: ClickUpTaskProvider._msToIso(task.date_updated),
    };
  }

  static _mapComment(comment) {
    return {
      remoteId: String(comment.id),
      author: (comment.user && (comment.user.username || comment.user.email)) || '',
      body: comment.comment_text || '',
      at: ClickUpTaskProvider._msToIso(comment.date) || new Date(0).toISOString(),
    };
  }

  static _msToIso(value) {
    if (value == null || value === '') return null;
    const ms = Number(value);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms).toISOString();
  }
}

module.exports = ClickUpTaskProvider;
