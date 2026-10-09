import ChatIcons from '../ChatIcons.js';
import ActionButton from '../common/ActionButton.js';
import RunTimeText from '../common/RunTimeText.js';
import ScheduledTaskView from './ScheduledTaskView.js';
import TriggerText from './TriggerText.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class TriggerSections {
  constructor(ctx) {
    this._ctx = ctx;
  }

  appendAll(view, data) {
    const { t } = data;
    if ((t.source || {}).memory || t.memory) this._memory(view, t);
    if (data.versions.length > 1) this._versions(view, t, data.versions);
    this._runs(view, data.runs);
    this._deliveries(view, data.deliveries, data.deliveryCounts);
  }

  _sectionHead(view, text) {
    const head = Dom.el('div', 'cm-sched-runs-head');
    head.textContent = text;
    view.appendChild(head);
    return head;
  }

  _reopen(t) {
    return async () => {
      await this._ctx.convList.refresh();
      this._ctx.triggers.open(t.id);
    };
  }

  _memory(view, t) {
    const esc = HtmlEscaper.escape;
    this._sectionHead(view, 'Memory' + ((t.source || {}).memory ? '' : ' (off, notes kept)'));
    const box = Dom.el('div', 'cm-run cm-mem');
    box.innerHTML = (t.memory
      ? '<pre class="cm-run-event">' + esc(t.memory) + '</pre><div class="cm-run-pending">notes saved ' + esc(RunTimeText.when(t.memoryAt)) + '</div>'
      : '<div class="cm-empty">No notes saved yet. Each run may save what is worth remembering.</div>')
      + (t.memory ? '<div class="cm-run-tools"><button type="button" class="cm-sched-btn" data-act="clear-memory">' + ChatIcons.x + 'Clear memory</button></div>' : '');
    const clearBtn = box.querySelector('[data-act="clear-memory"]');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => ActionButton.run(clearBtn, () => this._ctx.api.triggers.clearMemory(t.id), {
        fallback: 'could not clear', onSuccess: this._reopen(t),
      }));
    }
    view.appendChild(box);
  }

  _versions(view, t, versions) {
    this._sectionHead(view, 'Instruction versions (' + versions.length + ')');
    for (const v of versions) view.appendChild(this._versionRow(t, v));
  }

  _versionRow(t, v) {
    const esc = HtmlEscaper.escape;
    const row = Dom.el('details', 'cm-run cm-ver');
    row.dataset.version = String(v.n);
    const a = v.action || {};
    const label = v.current ? 'live' : (v.tested ? 'tested' : 'untested');
    row.innerHTML = '<summary class="cm-run-head">'
      +   '<span class="cm-run-dot ' + (v.current ? 'ok' : (v.tested ? 'warn' : 'running')) + '"></span>'
      +   '<span class="cm-run-when">v' + esc(String(v.n)) + ' · ' + esc(RunTimeText.when(v.at)) + '</span>'
      +   '<span class="cm-run-kind">' + esc(v.origin === 'chat' ? 'from chat' : v.origin) + '</span>'
      +   '<span class="cm-deliv-what">' + esc(String(a.prompt || '').replace(/\s+/g, ' ').slice(0, 70)) + '</span>'
      +   '<span class="cm-run-status">' + esc(label) + '</span>'
      + '</summary>'
      + '<div class="cm-run-body">'
      +   (v.note ? '<div class="cm-run-pending">' + esc(v.note) + '</div>' : '')
      +   '<div class="cm-run-pending">' + esc(a.mode || 'agent') + ' mode' + (a.expect ? ' · result must have: ' + esc(Object.keys(a.expect).join(', ')) : '') + (a.artifactRootId ? ' · feeds an artifact' : '') + '</div>'
      +   '<div class="cm-sched-prompt-body">' + esc(a.prompt || '') + '</div>'
      +   (v.current ? '' : '<div class="cm-run-tools"><button type="button" class="cm-sched-btn" data-restore="' + esc(String(v.n)) + '">' + ChatIcons.play + 'Restore v' + esc(String(v.n)) + (v.tested ? ' (tested)' : '') + '</button></div>')
      + '</div>';
    const restore = row.querySelector('[data-restore]');
    if (restore) {
      restore.addEventListener('click', () => ActionButton.run(restore,
        () => this._ctx.api.triggers.rollback(t.id, parseInt(restore.dataset.restore, 10)),
        { fallback: 'could not restore', restoreHtml: ChatIcons.play + 'Restore v' + v.n, onSuccess: this._reopen(t) }));
    }
    return row;
  }

  _runs(view, runs) {
    this._sectionHead(view, 'Runs (' + runs.length + ')');
    if (!runs.length) view.appendChild(Dom.el('div', 'cm-empty', 'No runs yet'));
    for (const r of runs) view.appendChild(this._runRow(r));
    const firstRun = view.querySelector('.cm-run[data-run-id]');
    if (firstRun) firstRun.open = true;
  }

  _runRow(r) {
    const esc = HtmlEscaper.escape;
    const row = Dom.el('details', 'cm-run');
    row.dataset.runId = r.id;
    const kindChip = (r.kind && r.kind !== 'event' ? '<span class="cm-run-kind">' + esc(r.kind) + '</span>' : '')
      + (r.attempt > 1 ? '<span class="cm-run-kind" title="retry of ' + esc(r.retryOf || '') + '">retry ' + esc(String(r.attempt)) + '</span>' : '');
    row.innerHTML = ScheduledTaskView.runRowHtml(r, kindChip, {
      before: r.event != null ? '<details class="cm-run-event"><summary>Event</summary>' + esc(TriggerText.prettyEvent(r.event)) + '</details>' : '',
      after: r.event != null && r.status !== 'running'
        ? '<div class="cm-run-tools"><button type="button" class="cm-sched-btn" data-act="replay">' + ChatIcons.play + 'Replay this event</button></div>' : '',
    });
    const replay = row.querySelector('[data-act="replay"]');
    if (replay) {
      replay.addEventListener('click', () => ActionButton.run(replay, () => this._ctx.api.triggers.replay(r.id), {
        fallback: 'could not start', restoreHtml: ChatIcons.play + 'Replay this event',
      }));
    }
    return row;
  }

  _deliveries(view, deliveries, counts) {
    const head = this._sectionHead(view, '');
    const countBits = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => HtmlEscaper.escape(TriggerText.deliveryLabel(k)) + ' ' + n);
    head.innerHTML = 'Deliveries' + (countBits.length ? ' <span class="cm-deliv-counts">' + countBits.join(' · ') + '</span>' : '');
    if (!deliveries.length) view.appendChild(Dom.el('div', 'cm-empty', 'Nothing has arrived yet'));
    for (const d of deliveries) view.appendChild(TriggerSections._deliveryRow(view, d));
  }

  static _deliveryRow(view, d) {
    const esc = HtmlEscaper.escape;
    const row = Dom.el('details', 'cm-run cm-deliv');
    const dot = TriggerText.deliveryDot(d.outcome);
    row.innerHTML = '<summary class="cm-run-head">'
      +   '<span class="cm-run-dot ' + esc(dot) + '"></span>'
      +   '<span class="cm-run-when">' + esc(RunTimeText.when(d.at)) + '</span>'
      +   '<span class="cm-run-kind">' + esc(d.source || '') + '</span>'
      +   '<span class="cm-deliv-what">' + esc(String(TriggerSections._what(d.event || {})).slice(0, 60)) + '</span>'
      +   '<span class="cm-run-status">' + esc(TriggerText.deliveryLabel(d.outcome)) + '</span>'
      + '</summary>'
      + '<div class="cm-run-body">'
      +   (d.detail ? '<div class="' + (dot === 'error' ? 'cm-run-error' : 'cm-run-pending') + '">' + esc(d.detail) + '</div>' : '')
      +   (d.remote ? '<div class="cm-run-pending">from ' + esc(d.remote) + '</div>' : '')
      +   (d.event ? '<pre class="cm-run-event">' + esc(TriggerText.prettyEvent(d.event)) + '</pre>' : '')
      +   (d.runId ? '<div class="cm-run-tools"><button type="button" class="cm-sched-btn" data-run="' + esc(d.runId) + '">' + ChatIcons.doc + 'Open run</button></div>' : '')
      + '</div>';
    const openRun = row.querySelector('[data-run]');
    if (openRun) {
      openRun.addEventListener('click', () => {
        const target = view.querySelector('.cm-run[data-run-id="' + openRun.dataset.run + '"]');
        if (target) { target.open = true; target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      });
    }
    return row;
  }

  static _what(ev) {
    if (ev.name) return ev.name;
    if (ev.bodyKeys) return '{' + ev.bodyKeys.slice(0, 4).join(', ') + (ev.bodyKeys.length > 4 ? ', …' : '') + '}';
    return ev.url || ev.bodyPreview || '';
  }
}
