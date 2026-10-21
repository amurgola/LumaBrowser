import Dom from '../../../core/llm-server/ui/js/dom/Dom.js';
import TimeText from '../../ui-kit/ui/TimeText.js';
import StatusText from './StatusText.js';

export default class RunList {
  static LIMIT = 10;

  constructor(invoke) {
    this._invoke = invoke;
  }

  async load(endpointId, el) {
    if (!el) return;
    let runs;
    try {
      runs = await this._invoke('listRuns', endpointId, RunList.LIMIT);
    } catch (_) {
      el.textContent = '';
      el.appendChild(Dom.el('div', 'luma-error', 'Could not load runs.'));
      return;
    }
    RunList.render(el, Array.isArray(runs) ? runs : []);
  }

  static render(el, runs) {
    el.textContent = '';
    if (!runs.length) {
      el.appendChild(Dom.el('div', 'luma-empty luma-empty--plain', 'No runs yet. Click Run to try it now.'));
      return;
    }
    const list = Dom.el('div', 'sapi-runs');
    for (const run of runs) list.appendChild(RunList.row(run));
    el.appendChild(list);
  }

  static row(run) {
    const row = Dom.el('div', 'sapi-run');
    row.dataset.runId = run.id;
    const badge = Dom.el('span', `luma-badge ${RunList.badge(run.status)}`);
    badge.textContent = run.status || 'unknown';
    row.appendChild(badge);
    if (run.kind === 'test') row.appendChild(Dom.el('span', 'luma-badge muted', 'test'));
    const time = Dom.el('span', 'sapi-run-time');
    time.textContent = TimeText.formatTime(run.startedAt);
    row.appendChild(time);
    if (run.durationMs != null) row.appendChild(Dom.el('span', 'sapi-run-dur', StatusText.duration(run.durationMs)));
    if (run.fault) {
      const fault = Dom.el('span', 'sapi-run-fault');
      fault.textContent = `${run.fault.code || 'fault'}: ${run.fault.message || ''}`;
      fault.title = fault.textContent;
      row.appendChild(fault);
    }
    return row;
  }

  static badge(status) {
    if (status === 'ok') return 'ok';
    if (status === 'failed') return 'bad';
    return status === 'running' ? 'warn' : 'muted';
  }
}
