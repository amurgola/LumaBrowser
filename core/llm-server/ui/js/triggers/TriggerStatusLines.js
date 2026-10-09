import HtmlEscaper from '../format/HtmlEscaper.js';
import TriggerIcons from './TriggerIcons.js';
import TriggerText from './TriggerText.js';

const esc = HtmlEscaper.escape;

export default class TriggerStatusLines {
  static REFUSED = {
    duplicate: 'duplicate delivery', unarmed: 'refused: not armed', rate_limited: 'rate limited', rejected: 'rejected',
    no_secret: 'refused: secret not set', queue_dropped: 'dropped: queue full', dropped: 'dropped', error: 'failed',
    filtered: 'filtered out', cooldown: 'skipped: cooldown', quiet: 'skipped: quiet hours',
  };

  static REFUSED_WINDOW_MS = 6 * 3600000;
  static DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  static build(t, state, now = Date.now()) {
    return [
      TriggerStatusLines._failures(t),
      TriggerStatusLines._drift(t),
      TriggerStatusLines._restore(t, state.versions),
      TriggerStatusLines._approval(state.pending),
      TriggerStatusLines._pending(state.pending, now),
      TriggerStatusLines._agent(state.agent),
      TriggerStatusLines.gating(t),
      TriggerStatusLines.lastRefused(state.deliveries, now),
      TriggerStatusLines._expectations(t),
      TriggerStatusLines._sample(t),
      TriggerStatusLines._lastTest(t, now),
      state.note ? '<div class="cm-trig-note ' + esc(state.note.cls || '') + '">' + esc(state.note.text) + '</div>' : '',
    ].join('');
  }

  static gating(t) {
    const s = t.source || {};
    const bits = [];
    if (s.filter) { const n = Object.keys(s.filter).length; bits.push('filter: ' + n + ' rule' + (n === 1 ? '' : 's')); }
    if (s.cooldownMs) bits.push('cooldown ' + Math.round(s.cooldownMs / 1000) + ' s');
    if (s.batch) bits.push('batch ' + Math.round(s.batch.windowMs / 1000) + ' s / ' + s.batch.max);
    if (s.approval === 'ask') bits.push('asks before state-changing tools' + (Array.isArray(s.approvedTools) && s.approvedTools.length ? ' (always allowed: ' + s.approvedTools.join(', ') + ')' : ''));
    if (s.quietHours) bits.push(TriggerStatusLines._quietHours(s.quietHours));
    if (t.kind === 'webhook' && (s.preset === 'slack' || s.preset === 'github')) bits.push(s.botGuard === false ? 'bot loop guard OFF' : 'ignores bot messages');
    if (s.memory) bits.push('remembers' + (s.memory.runs ? ' the last ' + s.memory.runs + ' runs' : '') + (t.memory ? ' · notes saved' : ''));
    if (!bits.length) return '';
    return '<div class="cm-trig-hint">' + esc(bits.join(' · ')) + '</div>';
  }

  static lastRefused(deliveries, now = Date.now()) {
    const list = deliveries || [];
    const d = list.find((x) => TriggerStatusLines.REFUSED[x.outcome]);
    if (!d || now - new Date(d.at).getTime() > TriggerStatusLines.REFUSED_WINDOW_MS) return '';
    const newest = list[0];
    const stale = newest && newest.id !== d.id && (newest.outcome === 'fired' || newest.outcome === 'captured');
    return '<div class="cm-trig-last ' + (stale ? '' : 'error') + '">Last ' + esc(TriggerStatusLines.REFUSED[d.outcome]) + ' ' + esc(TriggerText.when(d.at, now))
      + (d.detail ? ': ' + esc(String(d.detail).slice(0, 120)) : '') + '</div>';
  }

  static _quietHours(q) {
    const days = Array.isArray(q.days) ? ' ' + q.days.map((d) => TriggerStatusLines.DAY_NAMES[d]).join(',') : '';
    return 'quiet ' + q.start + '–' + q.end + days + ' (' + (q.mode === 'skip' ? 'skips' : 'holds events') + ')';
  }

  static _failures(t) {
    if (t.pausedReason) return '<div class="cm-trig-last error">' + esc(t.pausedReason) + '</div>';
    if (t.consecutiveFailures > 0 && t.status === 'armed') {
      return '<div class="cm-trig-last error">' + esc(String(t.consecutiveFailures)) + ' failed run' + (t.consecutiveFailures === 1 ? '' : 's') + ' in a row</div>';
    }
    return '';
  }

  static _drift(t) {
    const d = t.lastDrift;
    if (!d) return '';
    const bits = [];
    if (d.missing && d.missing.length) bits.push('missing ' + d.missing.join(', '));
    if (d.typeChanged && d.typeChanged.length) bits.push(d.typeChanged.map((c) => c.path + ' is now ' + c.to + ' (was ' + c.from + ')').join(', '));
    if (d.contentTypeChanged) bits.push('content type is now ' + d.contentTypeChanged.to);
    return '<div class="cm-trig-last error">Payload shape changed since the test (' + esc(String(d.count || 1)) + '×): ' + esc(bits.join('; '))
      + (d.added && d.added.length ? '; new: ' + esc(d.added.slice(0, 6).join(', ')) : '')
      + ' <button type="button" class="cm-trig-link" data-act="adopt">Use latest as sample</button></div>';
  }

  static _restore(t, versions) {
    if (!(versions && versions.previousTested && !t.enabled && t.status === 'needs_test')) return '';
    const tested = esc(String(versions.previousTested));
    return '<div class="cm-trig-last">Instruction v' + esc(String(versions.current)) + ' is untested. '
      + '<button type="button" class="cm-trig-link" data-act="restore" data-version="' + tested + '">Restore tested v' + tested + '</button></div>';
  }

  static _approval(pending) {
    const a = pending && pending.approval;
    if (!a) return '';
    return '<div class="cm-trig-approval">'
      + '<div class="cm-trig-last error">Waiting for your approval: <code>' + esc(a.tool) + '</code> ' + esc(a.detail || '') + '</div>'
      + (a.params ? '<code class="cm-trig-approval-params">' + esc(a.params) + '</code>' : '')
      + '<div class="cm-trig-actions">'
      + '<button type="button" class="cm-sched-btn primary" data-act="approve" data-decision="allow">' + TriggerIcons.CHECK + 'Allow</button>'
      + '<button type="button" class="cm-sched-btn" data-act="approve" data-decision="allow_run">Allow for this run</button>'
      + '<button type="button" class="cm-sched-btn" data-act="approve" data-decision="allow_always">Always allow ' + esc(a.tool) + '</button>'
      + '<button type="button" class="cm-sched-btn" data-act="approve" data-decision="deny">Deny</button>'
      + '</div></div>';
  }

  static _pending(pending, now) {
    if (!pending) return '';
    let html = '';
    if (pending.retry) {
      const secs = Math.max(0, Math.round((new Date(pending.retry.at).getTime() - now) / 1000));
      html += '<div class="cm-trig-last">Retry ' + esc(String(pending.retry.attempt)) + ' in ' + esc(String(secs)) + ' s after a failed run</div>';
    }
    if (pending.deferred) {
      const d = pending.deferred;
      const at = new Date(d.resumesAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      html += '<div class="cm-trig-last">' + esc(String(d.count)) + ' event' + (d.count === 1 ? '' : 's') + ' held for quiet hours until ' + esc(at) + '</div>';
    }
    if (pending.batch > 0) {
      html += '<div class="cm-trig-last">' + esc(String(pending.batch)) + ' event' + (pending.batch === 1 ? '' : 's') + ' collected in the current batch window</div>';
    }
    return html;
  }

  static _agent(agent) {
    if (!agent) return '';
    return agent.missing
      ? '<div class="cm-trig-last error">Runs through agent ' + esc(agent.id) + ', which no longer exists. Pick another agent in this chat.</div>'
      : '<div class="cm-trig-hint">Runs through agent ' + esc(agent.name) + '</div>';
  }

  static _expectations(t) {
    if (!(t.action && (t.action.expect || t.action.artifactRootId))) return '';
    const bits = [];
    if (t.action.expect) bits.push('result must have: ' + Object.keys(t.action.expect).join(', '));
    if (t.action.artifactRootId) bits.push('feeds artifact ' + t.action.artifactRootId);
    return '<div class="cm-trig-hint">' + esc(bits.join(' · ')) + '</div>';
  }

  static _sample(t) {
    if (!t.sample || t.status === 'awaiting_sample') return '';
    return '<div class="cm-trig-sample"><span class="cm-trig-label">Sample</span><code>' + esc(TriggerText.preview(t.sample)) + '</code></div>';
  }

  static _lastTest(t, now) {
    const test = t.lastTest;
    if (!test || t.status === 'awaiting_sample') return '';
    return '<div class="cm-trig-last ' + (test.ok ? 'ok' : 'error') + '">'
      + (test.ok ? TriggerIcons.CHECK + 'Test passed ' : 'Test failed ') + esc(TriggerText.when(test.at, now))
      + (test.error ? ': ' + esc(String(test.error).slice(0, 160)) : '')
      + (test.configHash && !t.armable && test.ok ? ' (before the last edit)' : '')
      + '</div>';
  }
}
