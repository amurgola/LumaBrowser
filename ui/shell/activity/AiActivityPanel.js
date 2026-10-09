import AiActivityState from './AiActivityState.js';
import AiActivityHtml from './AiActivityHtml.js';

export default class AiActivityPanel {
  constructor() {
    this._state = new AiActivityState();
    this._timer = null;
    this._renderScheduled = false;
  }

  install() {
    const api = window.llmQueueAPI;
    if (!api) return;
    this._el = AiActivityPanel._elements();
    if (!this._el.panel || !this._el.toggleBtn) return;
    this._el.toggleBtn.addEventListener('click', () => this._toggle());
    this._el.closeBtn.addEventListener('click', () => this._close());
    this._subscribe(api);
  }

  render() {
    const { body, emptyMsg, badge, toggleCount, toggleBtn } = this._el;
    const total = this._state.totalActive();
    badge.textContent = total;
    toggleCount.classList.toggle('visible', total > 0);
    toggleBtn.classList.toggle('has-active', total > 0);
    if (total > 0) toggleCount.textContent = total;
    if (total === 0 && this._state.models.size === 0) {
      body.innerHTML = '';
      body.appendChild(emptyMsg);
      emptyMsg.style.display = '';
      return;
    }
    emptyMsg.style.display = 'none';
    AiActivityPanel._replaceBody(body, emptyMsg, AiActivityHtml.render(this._state));
    this._updateTimers();
  }

  static _elements() {
    const $ = (id) => document.getElementById(id);
    return {
      panel: $('aiActivityPanel'), toggleBtn: $('aiActivityToggle'), closeBtn: $('aiActivityClose'), body: $('aiActivityBody'),
      emptyMsg: $('aiActivityEmpty'), badge: $('aiActivityBadge'), toggleCount: $('aiActivityToggleCount'),
    };
  }

  _subscribe(api) {
    const state = this._state;
    api.onTaskQueued((task) => { state.queued(task); this._scheduleRender(); });
    api.onTaskProcessing((task) => { state.processing(task); this._scheduleRender(); });
    api.onTaskCompleted((task) => { state.completed(task); this._scheduleRender(); });
    api.onQueueStats((stats) => { state.stats(stats); this._scheduleRender(); });
    api.onQueueRegistered((data) => state.ensureModel(data.modelId, data.maxConcurrency));
    const onRun = (evt, title) => { if (state.backgroundRun(evt, title)) this._scheduleRender(); };
    if (api.onSchedTaskEvent) api.onSchedTaskEvent((evt) => onRun(evt, 'Scheduled task'));
    if (window.ipcBridge && typeof window.ipcBridge.on === 'function') {
      try { window.ipcBridge.on('core.dashboard.tasks.event', (evt) => onRun(evt, 'Dashboard widget refresh')); } catch (_) {}
    }
  }

  _scheduleRender() {
    if (this._renderScheduled) return;
    this._renderScheduled = true;
    requestAnimationFrame(() => {
      this._renderScheduled = false;
      this.render();
    });
  }

  _toggle() {
    const isActive = this._el.panel.classList.toggle('active');
    this._el.toggleBtn.classList.toggle('is-open', isActive);
    if (isActive && !this._timer) {
      this._timer = setInterval(() => this._updateTimers(), 1000);
      this._refreshFromSnapshot();
    } else if (!isActive && this._timer) {
      this._stopTimer();
    }
  }

  _close() {
    this._el.panel.classList.remove('active');
    this._el.toggleBtn.classList.remove('is-open');
    this._stopTimer();
  }

  _stopTimer() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  _refreshFromSnapshot() {
    window.llmQueueAPI.getSnapshot().then((snapshot) => {
      this._state.loadSnapshot(snapshot);
      this.render();
    }).catch(() => {});
  }

  _updateTimers() {
    const now = Date.now();
    for (const el of this._el.body.querySelectorAll('.ai-activity-task-timer[data-timestamp]')) {
      const ts = parseInt(el.dataset.timestamp, 10);
      if (ts) el.textContent = AiActivityHtml.elapsed(now - ts);
    }
  }

  static _replaceBody(body, emptyMsg, html) {
    const fragment = document.createElement('div');
    fragment.innerHTML = html;
    body.innerHTML = '';
    body.appendChild(emptyMsg);
    while (fragment.firstChild) body.appendChild(fragment.firstChild);
  }
}
