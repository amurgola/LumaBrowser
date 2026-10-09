class ClickUpClient {
  static BASE_URL = 'https://api.clickup.com/api/v2';
  static TIMEOUT_MS = 20000;
  static MAX_RETRY_AFTER_MS = 30000;
  static DEFAULT_RETRY_AFTER_MS = 2000;
  static PAGE_SIZE = 100;

  constructor({ token, fetchImpl = null, now = () => Date.now(), sleep = null } = {}) {
    if (!token) throw new Error('ClickUpClient requires a token');
    this._token = String(token);
    this._fetch = fetchImpl || ((...args) => fetch(...args));
    this._now = now;
    this._sleep = sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async me() {
    const { user } = await this._request('GET', '/user');
    return { id: String(user.id), username: user.username || '', email: user.email || '' };
  }

  async teams() {
    return (await this._request('GET', '/team')).teams || [];
  }

  async spaces(teamId) {
    return (await this._request('GET', `/team/${encodeURIComponent(teamId)}/space?archived=false`)).spaces || [];
  }

  async folders(spaceId) {
    return (await this._request('GET', `/space/${encodeURIComponent(spaceId)}/folder?archived=false`)).folders || [];
  }

  async folderLists(folderId) {
    return (await this._request('GET', `/folder/${encodeURIComponent(folderId)}/list?archived=false`)).lists || [];
  }

  async folderlessLists(spaceId) {
    return (await this._request('GET', `/space/${encodeURIComponent(spaceId)}/list?archived=false`)).lists || [];
  }

  async list(listId) {
    return this._request('GET', `/list/${encodeURIComponent(listId)}`);
  }

  async listMembers(listId) {
    return (await this._request('GET', `/list/${encodeURIComponent(listId)}/member`)).members || [];
  }

  async listTasks(listId, { assigneeIds = [], includeClosed = false, subtasks = true } = {}) {
    const tasks = [];
    for (let page = 0; ; page++) {
      const result = await this._request('GET', `/list/${encodeURIComponent(listId)}/task?${ClickUpClient._taskQuery({ assigneeIds, includeClosed, subtasks, page })}`);
      const batch = result.tasks || [];
      tasks.push(...batch);
      if (result.last_page === true || batch.length < ClickUpClient.PAGE_SIZE) break;
    }
    return tasks;
  }

  async taskComments(taskId) {
    return (await this._request('GET', `/task/${encodeURIComponent(taskId)}/comment`)).comments || [];
  }

  async postComment(taskId, text) {
    return this._request('POST', `/task/${encodeURIComponent(taskId)}/comment`, { comment_text: String(text), notify_all: false });
  }

  async createTask(listId, body) {
    return this._request('POST', `/list/${encodeURIComponent(listId)}/task`, body);
  }

  async updateTask(taskId, body) {
    return this._request('PUT', `/task/${encodeURIComponent(taskId)}`, body);
  }

  static _taskQuery({ assigneeIds, includeClosed, subtasks, page }) {
    const params = new URLSearchParams();
    for (const id of assigneeIds) params.append('assignees[]', String(id));
    params.set('include_closed', includeClosed ? 'true' : 'false');
    params.set('subtasks', subtasks ? 'true' : 'false');
    params.set('page', String(page));
    return params.toString();
  }

  async _request(method, path, body) {
    const response = await this._send(method, path, body);
    if (response.status === 429) {
      await this._sleep(ClickUpClient._retryAfterMs(response));
      return ClickUpClient._parse(await this._send(method, path, body));
    }
    return ClickUpClient._parse(response);
  }

  async _send(method, path, body) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), ClickUpClient.TIMEOUT_MS) : null;
    try {
      return await this._fetch(`${ClickUpClient.BASE_URL}${path}`, {
        method,
        headers: { Authorization: this._token, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller ? controller.signal : undefined,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  static _retryAfterMs(response) {
    const header = response.headers && typeof response.headers.get === 'function' ? response.headers.get('retry-after') : null;
    const seconds = parseFloat(header);
    if (!Number.isFinite(seconds) || seconds <= 0) return ClickUpClient.DEFAULT_RETRY_AFTER_MS;
    return Math.min(ClickUpClient.MAX_RETRY_AFTER_MS, seconds * 1000);
  }

  static async _parse(response) {
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : {}; } catch (_) { json = null; }
    if (response.ok) return json || {};
    throw new Error(ClickUpClient._errorMessage(response.status, json, text));
  }

  static _errorMessage(status, json, text) {
    const detail = json && (json.err || json.error || json.message);
    const code = json && json.ECODE ? ` [${json.ECODE}]` : '';
    const fallback = text ? text.slice(0, 200) : 'no response body';
    return `ClickUp API ${status}${code}: ${detail || fallback}`;
  }
}

module.exports = ClickUpClient;
