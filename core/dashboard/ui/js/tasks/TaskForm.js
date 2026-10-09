export default class TaskForm {
  static INTERVALS = [
    { label: 'Every 15 minutes', minutes: 15 },
    { label: 'Every 30 minutes', minutes: 30 },
    { label: 'Every hour', minutes: 60 },
    { label: 'Every 6 hours', minutes: 360 },
    { label: 'Every 24 hours', minutes: 1440 },
  ];

  static DEFAULT_MINUTES = 30;
  static MIN_CUSTOM_MINUTES = 5;
  static DEFAULT_CUSTOM_MINUTES = 45;

  constructor(api, doc, rootId, onCreated) {
    this._api = api;
    this._doc = doc;
    this._rootId = rootId;
    this._onCreated = onCreated;
  }

  build() {
    const form = this._doc.createElement('div');
    form.className = 'db-task-form';
    form.innerHTML = TaskForm._html();
    this._form = form;
    this._wire();
    return form;
  }

  static minutesFrom(selectValue, customValue) {
    if (selectValue !== 'custom') return parseInt(selectValue, 10);
    return Math.max(TaskForm.MIN_CUSTOM_MINUTES, parseInt(customValue, 10) || TaskForm.DEFAULT_CUSTOM_MINUTES);
  }

  _wire() {
    const intervalSel = this._form.querySelector('.f-interval');
    const customMin = this._form.querySelector('.f-custom-min');
    intervalSel.addEventListener('change', () => { customMin.hidden = intervalSel.value !== 'custom'; });
    this._form.querySelector('.f-create').addEventListener('click', () => this._create());
  }

  async _create() {
    const promptEl = this._form.querySelector('.f-prompt');
    const prompt = promptEl.value.trim();
    if (!prompt) { promptEl.focus(); return; }
    const minutes = TaskForm.minutesFrom(this._form.querySelector('.f-interval').value, this._form.querySelector('.f-custom-min').value);
    const r = await this._api.tasks.create({
      rootId: this._rootId,
      title: this._form.querySelector('.f-title').value.trim() || 'Scheduled update',
      prompt,
      intervalMs: minutes * 60000,
    });
    if (r && r.success) this._onCreated();
  }

  static _html() {
    const options = TaskForm.INTERVALS
      .map((i) => '<option value="' + i.minutes + '"' + (i.minutes === TaskForm.DEFAULT_MINUTES ? ' selected' : '') + '>' + i.label + '</option>')
      .join('');
    return '<h3>New scheduled update</h3>'
      + '<input class="f-title" type="text" placeholder="Name (e.g. BTC price refresh)">'
      + '<textarea class="f-prompt" rows="3" placeholder="What should each run do? Name the data keys the widget reads and where to get the values."></textarea>'
      + '<div class="db-task-form-row">'
      + '<select class="f-interval">' + options + '<option value="custom">Custom…</option></select>'
      + '<input class="f-custom-min" type="number" min="5" step="5" value="45" title="Interval in minutes (min 5)" hidden>'
      + '<button class="db-primary f-create" type="button">Schedule</button>'
      + '</div>'
      + '<p class="db-muted">Runs wait for active chats to finish before using the model.</p>';
  }
}
