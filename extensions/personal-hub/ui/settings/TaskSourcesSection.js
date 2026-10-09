import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Dialogs from '../../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import IntervalPicker from '../../../ui-kit/ui/IntervalPicker.js';
import HubSection from './HubSection.js';
import SourceStatus from './SourceStatus.js';

export default class TaskSourcesSection extends HubSection {
  static DEFAULT_INTERVAL_MS = 300000;
  static DEFAULT_ASSIGNEE = 'me';
  static LIST_SCOPES = [
    { value: 'mine', label: 'Assigned to me' },
    { value: 'mine-or-unassigned', label: 'Mine + unassigned' },
    { value: 'all', label: 'All tasks' },
  ];

  constructor(tab) {
    super(tab);
    this._sources = [];
    this._columns = [];
    this._interval = null;
    this._editing = null;
    this._discovered = null;
  }

  html() {
    return `
    <h4 class="luma-section-label">Task trackers <span class="luma-badge muted" id="ext-hub-tsCount">0</span></h4>
    <div class="luma-field-help">Each ClickUp workspace imports the tasks assigned to you from the lists you pick. Moving a card on the board changes the task's status; messages you write on a card are posted as comments.</div>
    <div class="luma-list ext-mt-8" id="ext-hub-tsList"></div>
    <details class="ext-details ext-mt-12" id="ext-hub-tsAdd">
      <summary id="ext-hub-tsFormTitle">Add a ClickUp workspace</summary>
      <div class="ext-form-grid ext-mt-8">
        <div class="luma-field">
          <label class="luma-field-label">Label</label>
          <input type="text" class="luma-field-input" id="ext-hub-tsLabel" placeholder="Acme ClickUp">
        </div>
        <div class="luma-field">
          <label class="luma-field-label">API token</label>
          <input type="password" class="luma-field-input" id="ext-hub-tsToken" placeholder="pk_...">
          <div class="luma-field-help">ClickUp > Settings > Apps > API token. Stored encrypted. Leave blank when editing to keep the saved one.</div>
        </div>
        <div class="luma-field">
          <label class="luma-field-label">Assignee</label>
          <input type="text" class="luma-field-input" id="ext-hub-tsAssignee" value="${TaskSourcesSection.DEFAULT_ASSIGNEE}">
          <div class="luma-field-help">"me" is the token's owner; or a member's name or email as shown in ClickUp.</div>
        </div>
        <div class="luma-field">
          <label class="luma-field-label">Sync</label>
          ${IntervalPicker.markup('ext-hub-tsInterval', TaskSourcesSection.DEFAULT_INTERVAL_MS)}
        </div>
        <div class="luma-field ext-form-grid-full">
          <label class="luma-check"><input type="checkbox" id="ext-hub-tsClosed"> Include closed tasks</label>
        </div>
        <div class="luma-field ext-form-grid-full">
          <div class="ext-layout-inline ext-layout-inline--gap-sm">
            <button class="luma-btn luma-btn--sm" id="ext-hub-tsDiscover">Load lists</button>
            <span class="luma-field-help" id="ext-hub-tsDiscoverNote" style="margin-top:0;"></span>
          </div>
          <div class="ext-mt-8" id="ext-hub-tsTree"></div>
        </div>
        <div class="luma-field ext-form-grid-full ext-hidden" id="ext-hub-tsMapWrap">
          <label class="luma-field-label">Status map</label>
          <div class="luma-field-help">The ClickUp status each board column stands for. Leave a column blank to match statuses by name.</div>
          <div class="ext-mt-8" id="ext-hub-tsMap"></div>
        </div>
      </div>
      <div class="luma-form-actions ext-form-buttons--start ext-mt-8">
        <button class="luma-btn" id="ext-hub-tsSaveBtn">Add workspace</button>
        <button class="luma-btn luma-btn--sm ext-hidden" id="ext-hub-tsCancelBtn">Cancel</button>
      </div>
    </details>`;
  }

  bind(container) {
    super.bind(container);
    this._interval = IntervalPicker.bind(this.$('tsInterval'));
    this.$('tsDiscover').addEventListener('click', () => this._discover());
    this.$('tsSaveBtn').addEventListener('click', () => this._save());
    this.$('tsCancelBtn').addEventListener('click', () => this._resetForm());
    this.$('tsList').addEventListener('click', (e) => this._onRowAction(e));
    this.$('tsTree').addEventListener('change', () => {
      this._syncScopeSelects();
      this._renderStatusMap();
    });
  }

  setColumns(columns) {
    this._columns = columns || [];
    this._renderList();
    if (this._discovered) this._renderStatusMap();
  }

  async load() {
    if (!this._root) return;
    const { sources } = await this.call('listTaskSources');
    this._sources = sources || [];
    this._renderList();
  }

  _renderList() {
    const list = this.$('tsList');
    const count = this.$('tsCount');
    if (count) count.textContent = String(this._sources.length);
    if (!list) return;
    if (!this._sources.length) {
      list.innerHTML = '<div class="luma-empty luma-empty--plain">No task trackers yet.</div>';
      return;
    }
    list.innerHTML = this._sources.map((s) => TaskSourcesSection._row(s, this._columns)).join('');
  }

  static _row(s, columns = []) {
    const esc = HtmlEscaper.escape;
    const lists = (s.config && s.config.listIds) || [];
    const links = TaskSourcesSection.linksText(s, columns);
    return `<div class="luma-dockpanel-row" data-id="${esc(s.id)}">
      <div class="luma-dockpanel-rowhead">
        <span class="luma-dot ${SourceStatus.dotClass(s)}"></span>
        <span class="luma-dockpanel-rowname">${esc(s.label)}</span>
        <span class="luma-badge muted">ClickUp</span>
        <span class="luma-badge muted">${lists.length} list${lists.length === 1 ? '' : 's'}</span>
        <span class="luma-dockpanel-rowactions">
          <button class="luma-btn luma-btn--sm" data-action="sync">Sync now</button>
          <button class="luma-btn luma-btn--sm" data-action="edit">Edit lists</button>
          ${links ? '<button class="luma-btn luma-btn--sm" data-action="reset">Reset links</button>' : ''}
          <button class="luma-btn luma-btn--sm" data-action="remove">Remove</button>
        </span>
      </div>
      <div class="luma-dockpanel-rowmeta">${esc(s.connected === false ? 'No token saved.' : SourceStatus.text(s))}</div>
      ${links ? `<div class="luma-dockpanel-rowmeta">Linked statuses: ${esc(links)}</div>` : ''}
    </div>`;
  }

  static linksText(source, columns = []) {
    const links = (source.config && source.config.statusColumns) || {};
    const labels = (source.config && source.config.statusLabels) || {};
    const title = (key) => ((columns.find((c) => c.key === key) || {}).title || key);
    return Object.entries(links).map(([status, key]) => `${labels[status] || status} -> ${title(key)}`).join(', ');
  }

  async _onRowAction(e) {
    const button = e.target.closest('button[data-action]');
    const row = e.target.closest('[data-id]');
    if (!button || !row) return;
    const id = row.dataset.id;
    const action = button.dataset.action;
    if (action === 'sync') return this.act(() => this.call('syncNow', { kind: 'tasks', sourceId: id }), 'Tasks synced.');
    if (action === 'edit') return this._edit(id);
    if (action === 'reset') {
      const ok = await Dialogs.confirm('Forget the statuses linked to columns for this workspace? Its tasks go back to matching columns by name, and unmatched statuses show as their own lanes again.');
      if (ok) await this.act(() => this.call('resetStatusLinks', id), 'Links reset.');
    }
    if (action === 'remove') {
      const ok = await Dialogs.confirm('Remove this workspace and its imported tasks from the board?');
      if (ok) await this.act(() => this.call('removeTaskSource', id), 'Workspace removed.');
    }
    return undefined;
  }

  async _edit(id) {
    const source = this._sources.find((s) => s.id === id);
    if (!source) return;
    this._editing = source;
    this.$('tsFormTitle').textContent = `Edit ${source.label}`;
    this.$('tsSaveBtn').textContent = 'Save changes';
    this.$('tsCancelBtn').classList.remove('ext-hidden');
    this.$('tsAdd').open = true;
    this.$('tsLabel').value = source.label || '';
    this.$('tsToken').value = '';
    this.$('tsAssignee').value = (source.config && source.config.assignee) || TaskSourcesSection.DEFAULT_ASSIGNEE;
    this.$('tsClosed').checked = !!(source.config && source.config.includeClosed);
    this._interval.set(source.intervalMs || TaskSourcesSection.DEFAULT_INTERVAL_MS);
    await this._discover();
  }

  _resetForm() {
    this._editing = null;
    this._discovered = null;
    this.$('tsFormTitle').textContent = 'Add a ClickUp workspace';
    this.$('tsSaveBtn').textContent = 'Add workspace';
    this.$('tsCancelBtn').classList.add('ext-hidden');
    this.$('tsLabel').value = '';
    this.$('tsToken').value = '';
    this.$('tsAssignee').value = TaskSourcesSection.DEFAULT_ASSIGNEE;
    this.$('tsClosed').checked = false;
    this.$('tsTree').innerHTML = '';
    this.$('tsMap').innerHTML = '';
    this.$('tsMapWrap').classList.add('ext-hidden');
    this.$('tsDiscoverNote').textContent = '';
  }

  async _discover() {
    const token = this.$('tsToken').value.trim();
    const request = token ? { token } : (this._editing ? { sourceId: this._editing.id } : null);
    const note = this.$('tsDiscoverNote');
    if (!request) {
      note.textContent = 'Enter the API token first.';
      return;
    }
    note.textContent = 'Loading';
    try {
      this._discovered = await this.call('discoverTaskSource', request);
      const user = this._discovered.user || {};
      note.textContent = user.username ? `Signed in as ${user.username}` : '';
      this._renderTree();
      this._renderStatusMap();
    } catch (err) {
      note.textContent = `Could not load lists: ${(err && err.message) || err}`;
    }
  }

  _renderTree() {
    const esc = HtmlEscaper.escape;
    const chosen = new Set((this._editing && this._editing.config && this._editing.config.listIds) || []);
    const scopes = (this._editing && this._editing.config && this._editing.config.listScopes) || {};
    const teams = (this._discovered && this._discovered.teams) || [];
    this.$('tsTree').innerHTML = teams.map((team) => `
      <div class="ext-card ext-mb-8">
        <div class="ext-card-header"><span class="ext-card-title">${esc(team.name)}</span></div>
        <div class="ext-card-body">${(team.spaces || []).map((space) => `
          <div class="ext-mb-8">
            <div class="luma-field-label">${esc(space.name)}</div>
            <div class="ext-checkbox-group">${(space.lists || []).map((list) => `
              <div class="ext-layout-inline ext-layout-inline--gap-sm">
                <label class="luma-check"><input type="checkbox" data-list-id="${esc(list.id)}"${chosen.has(String(list.id)) ? ' checked' : ''}> ${esc(list.name)}${list.folder ? ` <span class="luma-muted">(${esc(list.folder)})</span>` : ''}</label>
                ${TaskSourcesSection._scopeSelect(list.id, scopes[String(list.id)], chosen.has(String(list.id)))}
              </div>`).join('')}
            </div>
          </div>`).join('')}
        </div>
      </div>`).join('') || '<div class="luma-empty luma-empty--plain">No lists found.</div>';
  }

  static _scopeSelect(listId, value, enabled) {
    const esc = HtmlEscaper.escape;
    const current = value || TaskSourcesSection.LIST_SCOPES[0].value;
    return `<select class="luma-field-input" data-scope-for="${esc(listId)}" title="Which tasks of this list to import"${enabled ? '' : ' disabled'} style="width:auto;padding:2px 6px;font-size:12px">${TaskSourcesSection.LIST_SCOPES
      .map((s) => `<option value="${s.value}"${s.value === current ? ' selected' : ''}>${s.label}</option>`).join('')}</select>`;
  }

  _readListScopes() {
    const chosen = new Set(this._chosenListIds());
    const scopes = {};
    for (const el of this.$$('#ext-hub-tsTree select[data-scope-for]')) {
      const id = String(el.dataset.scopeFor);
      if (chosen.has(id) && el.value !== TaskSourcesSection.LIST_SCOPES[0].value) scopes[id] = el.value;
    }
    return scopes;
  }

  _syncScopeSelects() {
    for (const box of this.$$('#ext-hub-tsTree input[data-list-id]')) {
      const select = this.$$('#ext-hub-tsTree select[data-scope-for]').find((el) => el.dataset.scopeFor === box.dataset.listId);
      if (select) select.disabled = !box.checked;
    }
  }

  _renderStatusMap() {
    const esc = HtmlEscaper.escape;
    const wrap = this.$('tsMapWrap');
    const map = this.$('tsMap');
    if (!wrap || !map) return;
    const current = this._readStatusMap();
    const saved = (this._editing && this._editing.config && this._editing.config.statusMap) || {};
    const statuses = this._chosenStatuses();
    wrap.classList.toggle('ext-hidden', !this._chosenListIds().length);
    map.innerHTML = `<datalist id="ext-hub-tsStatuses">${statuses.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>`
      + this._columns.map((c) => `
      <div class="ext-form-row-inline ext-mb-8">
        <label class="luma-field-label" style="min-width:120px">${esc(c.title)}</label>
        <input type="text" class="luma-field-input" list="ext-hub-tsStatuses" data-column="${esc(c.key)}" value="${esc(current[c.key] != null ? current[c.key] : (saved[c.key] || ''))}" placeholder="ClickUp status">
      </div>`).join('');
  }

  _chosenListIds() {
    return this.$$('#ext-hub-tsTree input[data-list-id]:checked').map((el) => String(el.dataset.listId));
  }

  _chosenStatuses() {
    const chosen = new Set(this._chosenListIds());
    const names = new Set();
    for (const team of (this._discovered && this._discovered.teams) || []) {
      for (const space of team.spaces || []) {
        for (const list of space.lists || []) {
          if (chosen.has(String(list.id))) for (const s of list.statuses || []) names.add(s);
        }
      }
    }
    return [...names];
  }

  _readStatusMap() {
    const map = {};
    for (const el of this.$$('#ext-hub-tsMap input[data-column]')) {
      const value = el.value.trim();
      if (value) map[el.dataset.column] = value;
    }
    return map;
  }

  _readForm() {
    const token = this.$('tsToken').value.trim();
    const config = {
      listIds: this._chosenListIds(),
      listScopes: this._readListScopes(),
      assignee: this.$('tsAssignee').value.trim() || TaskSourcesSection.DEFAULT_ASSIGNEE,
      includeClosed: this.$('tsClosed').checked,
      statusMap: this._readStatusMap(),
    };
    if (token) config.token = token;
    return { kind: 'clickup', label: this.$('tsLabel').value.trim(), config, intervalMs: this._interval.get() };
  }

  async _save() {
    const input = this._readForm();
    if (!input.label) return this._tab.notify('Give the workspace a label.', false);
    if (!this._editing && !input.config.token) return this._tab.notify('Enter the API token.', false);
    if (!input.config.listIds.length) return this._tab.notify('Load lists and pick at least one.', false);
    const editing = this._editing;
    return this.act(async () => {
      if (editing) await this.call('updateTaskSource', editing.id, input);
      else await this.call('addTaskSource', input);
      this._resetForm();
    }, editing ? 'Workspace saved.' : 'Workspace added. First sync is running.');
  }
}
