import ChatIcons from '../ChatIcons.js';
import RunTimeText from '../common/RunTimeText.js';
import TriggerText from './TriggerText.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

const esc = HtmlEscaper.escape;

export default class TriggerHeaderHtml {
  static html(info) {
    const { t } = info;
    return '<div class="cm-sched-facts">'
      +   '<span class="cm-sched-fact' + (t.enabled ? '' : ' off') + '">' + esc(TriggerText.statusLabel(t)) + '</span>'
      +   '<span class="cm-sched-fact">' + TriggerHeaderHtml.sourceFact(t) + '</span>'
      +   '<span class="cm-sched-fact">' + esc(String(t.fireCount || 0)) + ' fire' + (t.fireCount === 1 ? '' : 's') + ' · ' + esc(TriggerHeaderHtml._lastFired(t)) + '</span>'
      +   TriggerHeaderHtml.extraFacts(t, info.pending).map((f) => '<span class="cm-sched-fact">' + f + '</span>').join('')
      + '</div>'
      + (t.pausedReason ? '<div class="cm-run-error">' + esc(t.pausedReason) + ' Fix the cause, then Resume.</div>' : '')
      + TriggerHeaderHtml.driftHtml(t)
      + TriggerHeaderHtml.approvalHtml(info.pending)
      + TriggerHeaderHtml.sourceRows(info)
      + '<details class="cm-sched-prompt"><summary>Instruction</summary>'
      +   '<div class="cm-sched-prompt-body">' + esc((t.action && t.action.prompt) || '') + '</div>'
      + '</details>'
      + (t.sample ? '<details class="cm-sched-prompt"><summary>Sample event</summary><pre class="cm-run-event">' + esc(TriggerText.prettyEvent(t.sample)) + '</pre></details>' : '')
      + TriggerHeaderHtml._actions(t);
  }

  static kind(t) {
    return { isFile: t.kind === 'file', isPage: t.kind === 'page', isNotif: t.kind === 'notification' };
  }

  static sourceFact(t) {
    const src = t.source || {};
    const { isFile, isPage, isNotif } = TriggerHeaderHtml.kind(t);
    const mode = esc((t.action && t.action.mode) || 'agent');
    if (isFile) return 'Folder watch · ' + mode + ' mode · ' + esc((src.events || ['add', 'change']).join(', ')) + (src.allowWrite ? ' · may write' : '');
    if (isPage) return 'Page watch · ' + mode + ' mode';
    if (isNotif) return 'Web notification · ' + mode + ' mode';
    return 'Webhook' + (src.preset && src.preset !== 'generic' ? ' (' + esc(src.preset) + ')' : '') + ' · ' + mode + ' mode · '
      + esc(src.respond === 'result' ? 'sender waits for result' : 'ack immediately');
  }

  static extraFacts(t, pending) {
    const src = t.source || {};
    const { isFile, isPage, isNotif } = TriggerHeaderHtml.kind(t);
    const facts = [];
    if (t._agent) facts.push(t._agent.missing ? 'agent ' + esc(t._agent.id) + ' (deleted)' : 'via agent ' + esc(t._agent.name));
    if (t.action && t.action.expect) facts.push('result must have: ' + esc(Object.keys(t.action.expect).join(', ')));
    if (t.action && t.action.artifactRootId) facts.push('feeds artifact ' + esc(t.action.artifactRootId));
    if (src.filter) facts.push('filter: ' + esc(Object.keys(src.filter).join(', ')));
    if (src.cooldownMs) facts.push('cooldown ' + Math.round(src.cooldownMs / 1000) + ' s');
    if (src.batch) facts.push('batch ' + Math.round(src.batch.windowMs / 1000) + ' s / ' + src.batch.max);
    if (src.approval === 'ask') facts.push(TriggerHeaderHtml._approvalFact(src));
    if (src.quietHours) facts.push('quiet ' + esc(src.quietHours.start + '–' + src.quietHours.end) + (src.quietHours.mode === 'skip' ? ' (skips)' : ' (holds)'));
    if (src.memory) facts.push('remembers' + (src.memory.runs ? ' the last ' + esc(String(src.memory.runs)) + ' runs' : ''));
    if (!isFile && !isPage && !isNotif && (src.preset === 'slack' || src.preset === 'github')) facts.push(src.botGuard === false ? 'bot loop guard OFF' : 'ignores bot messages');
    if (pending && pending.deferred) facts.push(TriggerHeaderHtml._deferredFact(pending.deferred));
    return facts;
  }

  static driftHtml(t) {
    const d = t.lastDrift;
    if (!d) return '';
    const parts = []
      .concat(d.missing && d.missing.length ? ['missing ' + d.missing.join(', ')] : [])
      .concat(d.typeChanged && d.typeChanged.length ? [d.typeChanged.map((c) => c.path + ' is now ' + c.to + ' (was ' + c.from + ')').join(', ')] : [])
      .concat(d.contentTypeChanged ? ['content type is now ' + d.contentTypeChanged.to] : []);
    return '<div class="cm-run-error">Payload shape changed since the test (' + esc(String(d.count || 1)) + '×): '
      + esc(parts.join('; '))
      + ' <button type="button" class="cm-trig-link" data-act="adopt">Use latest as sample</button></div>';
  }

  static approvalHtml(pending) {
    if (!pending || !pending.approval) return '';
    const a = pending.approval;
    return '<div class="cm-trig-approval">'
      + '<div class="cm-trig-last error">A run is waiting for your approval: <code>' + esc(a.tool) + '</code> ' + esc(a.detail || '') + '</div>'
      + (a.params ? '<code class="cm-trig-approval-params">' + esc(a.params) + '</code>' : '')
      + '<div class="cm-sched-actions">'
      +   '<button type="button" class="cm-sched-btn primary" data-approve="allow">' + ChatIcons.check + 'Allow</button>'
      +   '<button type="button" class="cm-sched-btn" data-approve="allow_run">Allow for this run</button>'
      +   '<button type="button" class="cm-sched-btn" data-approve="allow_always">Always allow ' + esc(a.tool) + '</button>'
      +   '<button type="button" class="cm-sched-btn" data-approve="deny">Deny</button>'
      + '</div></div>';
  }

  static sourceRows(info) {
    const { t } = info;
    const { isFile, isPage, isNotif } = TriggerHeaderHtml.kind(t);
    if (isFile) return TriggerHeaderHtml._folderRows(t.source || {}, info.watch);
    if (isNotif) return TriggerHeaderHtml._notificationRows(t.source || {});
    if (isPage) return TriggerHeaderHtml._pageRows(t.source || {});
    return TriggerHeaderHtml._webhookRows(info);
  }

  static _lastFired(t) {
    return t.lastFiredAt ? 'Last fired ' + RunTimeText.when(t.lastFiredAt) + (t.lastStatus ? ' (' + t.lastStatus + ')' : '') : 'Never fired';
  }

  static _approvalFact(src) {
    const always = Array.isArray(src.approvedTools) && src.approvedTools.length ? ' (always: ' + esc(src.approvedTools.join(', ')) + ')' : '';
    return 'asks before state-changing tools' + always;
  }

  static _deferredFact(deferred) {
    const at = new Date(deferred.resumesAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return esc(String(deferred.count)) + ' held until ' + esc(at);
  }

  static _row(scope, text, copyValue, copyTitle) {
    return '<div class="cm-trig-url"><span class="cm-trig-url-scope">' + scope + '</span>'
      + '<code class="cm-trig-url-text" title="' + esc(text) + '">' + esc(text) + '</code>'
      + (copyValue != null ? '<button type="button" class="cm-trig-icon" data-copy="' + esc(copyValue) + '" title="' + copyTitle + '">' + ChatIcons.copy + '</button>' : '')
      + '</div>';
  }

  static _folderRows(src, watch) {
    return TriggerHeaderHtml._row('folder', src.dir || '', src.dir || '', 'Copy path')
      + '<div class="cm-trig-url"><span class="cm-trig-url-scope">match</span><code class="cm-trig-url-text">' + esc(src.glob || '*') + (src.recursive ? ' · sub-folders' : '') + '</code></div>'
      + (watch && watch.error ? '<div class="cm-run-error">Not watching: ' + esc(watch.error) + '</div>' : '');
  }

  static _notificationRows(src) {
    return (src.tabPartition ? '<div class="cm-trig-url"><span class="cm-trig-url-scope">tab</span><code class="cm-trig-url-text" title="' + esc(src.tabUrl || '') + '">' + esc(src.tabTitle || src.tabUrl || src.tabPartition) + '</code></div>' : '')
      + (src.host ? '<div class="cm-trig-url"><span class="cm-trig-url-scope">site</span><code class="cm-trig-url-text">' + esc(src.host) + '</code></div>' : '');
  }

  static _pageRows(src) {
    return TriggerHeaderHtml._row('page', src.url || '', src.url || '', 'Copy URL')
      + '<div class="cm-trig-url"><span class="cm-trig-url-scope">monitor</span><code class="cm-trig-url-text">' + esc(src.name || src.monitorId || '') + '</code></div>';
  }

  static _webhookRows(info) {
    const { t } = info;
    const urls = TriggerText.urls(t, info.baseUrls);
    return urls.map((u) => TriggerHeaderHtml._row(esc(u.key), u.url, u.url, 'Copy URL')).join('')
      + TriggerHeaderHtml._secretRow(t.source || {}, info.secret)
      + (urls.length ? '<details class="cm-sched-prompt"><summary>curl example</summary><pre class="cm-trig-curl">' + esc(TriggerText.curl(urls[urls.length - 1].url, t.sample)) + '</pre></details>' : '');
  }

  static _secretRow(src, secret) {
    if (!(secret && (secret.required || secret.set || src.authHeader))) return '';
    const label = src.preset === 'slack' ? 'Slack signing secret' : (src.preset === 'github' ? 'GitHub webhook secret' : 'Auth token');
    return '<div class="cm-trig-url"><span class="cm-trig-url-scope">secret</span>'
      + '<input type="password" class="cm-trig-secret" data-secret autocomplete="off" placeholder="' + esc(secret.set ? label + ' is set; paste to replace' : 'paste the ' + label.toLowerCase()) + '">'
      + '<button type="button" class="cm-sched-btn' + (secret.set ? '' : ' primary') + '" data-act="secret">Save</button></div>'
      + (secret.required && !secret.set ? '<div class="cm-run-error">Not set: deliveries are refused until the ' + esc(label.toLowerCase()) + ' is entered.</div>' : '');
  }

  static _actions(t) {
    const arm = t.enabled
      ? '<button type="button" class="cm-sched-btn" data-act="pause">' + ChatIcons.pause + 'Pause</button>'
      : '<button type="button" class="cm-sched-btn' + (t.armable ? ' primary' : '') + '" data-act="arm"' + (t.armable ? '' : ' disabled title="Test the current configuration first"') + '>'
        + ChatIcons.play + (t.status === 'auto_paused' ? 'Resume' : 'Arm') + '</button>';
    return '<div class="cm-sched-actions">'
      + '<button type="button" class="cm-sched-btn" data-act="test"' + (t.sample ? '' : ' disabled title="No sample yet"') + '>' + ChatIcons.play + 'Send test event</button>'
      + arm
      + '<button type="button" class="cm-sched-btn" data-act="edit">' + ChatIcons.edit + 'Edit in chat</button>'
      + '</div>';
  }
}
