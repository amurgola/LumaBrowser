import HtmlEscaper from '../format/HtmlEscaper.js';
import TriggerIcons from './TriggerIcons.js';
import TriggerText from './TriggerText.js';

const esc = HtmlEscaper.escape;

export default class TriggerSourceRows {
  static SAMPLE_HINT = {
    notification: 'The next notification the site shows in that scope is stored as the sample and not run. Or paste one below.',
    file: 'Copy a matching file into the folder: the first event is stored as the sample and not run. Or pick a file that is already there.',
    page: 'The next change the Page Watcher detects is stored as the sample and not run. Or use the monitor\'s latest check now.',
    webhook: 'POST anything to this URL: the first request is stored as the sample and not run. Or type one below.',
  };

  static build(t, state) {
    const listening = t.status === 'awaiting_sample' || t.status === 'armed';
    if (t.kind === 'notification') return listening ? TriggerSourceRows._withHint(t, TriggerSourceRows._notification(t), 'notification') : '';
    if (t.kind === 'file') return listening ? TriggerSourceRows._withHint(t, TriggerSourceRows._folder(t, state), 'file') : '';
    if (t.kind === 'page') return listening ? TriggerSourceRows._withHint(t, TriggerSourceRows._page(t), 'page') : '';
    return TriggerSourceRows._webhook(t, state, listening) + TriggerSourceRows._secret(t, state);
  }

  static _withHint(t, rows, kind) {
    if (t.status !== 'awaiting_sample') return rows;
    return rows + '<div class="cm-trig-hint">' + TriggerSourceRows.SAMPLE_HINT[kind] + '</div>';
  }

  static _notification(t) {
    const s = t.source || {};
    return (s.tabPartition
      ? '<div class="cm-trig-url"><span class="cm-trig-url-scope">tab</span><code class="cm-trig-url-text" title="' + esc(s.tabUrl || '') + '">' + esc(s.tabTitle || s.tabUrl || s.tabPartition) + '</code></div>'
      : '')
      + (s.host ? '<div class="cm-trig-url"><span class="cm-trig-url-scope">site</span><code class="cm-trig-url-text">' + esc(s.host) + '</code></div>' : '');
  }

  static _page(t) {
    const s = t.source || {};
    return '<div class="cm-trig-url"><span class="cm-trig-url-scope">page</span>'
      + '<code class="cm-trig-url-text" title="' + esc(s.url || '') + '">' + esc(s.url || ('monitor ' + (s.monitorId || ''))) + '</code>'
      + TriggerSourceRows._copyButton(s.url || '', 'Copy URL') + '</div>'
      + (s.name ? '<div class="cm-trig-url"><span class="cm-trig-url-scope">monitor</span><code class="cm-trig-url-text">' + esc(s.name) + '</code></div>' : '');
  }

  static _folder(t, state) {
    const s = t.source || {};
    const events = Array.isArray(s.events) ? s.events.join(', ') : 'add, change';
    return '<div class="cm-trig-url"><span class="cm-trig-url-scope">folder</span>'
      + '<code class="cm-trig-url-text" title="' + esc(s.dir || '') + '">' + esc(s.dir || '') + '</code>'
      + TriggerSourceRows._copyButton(s.dir || '', 'Copy path') + '</div>'
      + '<div class="cm-trig-url"><span class="cm-trig-url-scope">match</span>'
      + '<code class="cm-trig-url-text">' + esc(s.glob || '*') + ' · ' + esc(events) + (s.recursive ? ' · sub-folders' : '') + (s.allowWrite ? ' · may write' : '') + '</code></div>'
      + (state.watch && state.watch.error ? '<div class="cm-trig-last error">Not watching: ' + esc(state.watch.error) + '</div>' : '');
  }

  static _webhook(t, state, listening) {
    const urls = TriggerText.hookUrls(t, state.baseUrls);
    if (!urls.length || !listening) return '';
    let html = TriggerSourceRows._urlRow(urls[0], true);
    if (urls.length > 1) {
      html += '<details class="cm-trig-more"><summary>All URLs</summary>'
        + urls.slice(1).map((u) => TriggerSourceRows._urlRow(u, false)).join('') + '</details>';
    }
    return TriggerSourceRows._withHint(t, html, 'webhook');
  }

  static _urlRow(u, primary) {
    return '<div class="cm-trig-url"><span class="cm-trig-url-scope">' + esc(u.key) + '</span>'
      + '<code class="cm-trig-url-text"' + (primary ? ' title="' + esc(u.url) + '"' : '') + '>' + esc(u.url) + '</code>'
      + TriggerSourceRows._copyButton(u.url, 'Copy URL') + '</div>';
  }

  static _copyButton(value, title) {
    return '<button type="button" class="cm-trig-icon" data-act="copy" data-url="' + esc(value) + '" title="' + title + '">' + TriggerIcons.COPY + '</button>';
  }

  static _secret(t, state) {
    const sec = state.secret;
    if (!sec || (!sec.required && !sec.set && !state.secretOpen)) return '';
    const label = TriggerSourceRows._secretLabel((t.source && t.source.preset) || 'generic');
    const status = sec.set
      ? '<span class="cm-trig-last ok">' + TriggerIcons.CHECK + esc(label) + ' set' + (sec.encrypted ? ' (encrypted)' : '') + '</span>'
      : '<span class="cm-trig-last error">' + esc(label) + ' not set' + (sec.required ? ': the trigger will not fire until it is' : '') + '</span>';
    return '<div class="cm-trig-secretrow">' + status
      + (state.secretOpen ? '' : ' <button type="button" class="cm-trig-link" data-act="secret-open">' + (sec.set ? 'Replace' : 'Enter it') + '</button>')
      + (state.secretOpen ? TriggerSourceRows._secretForm(label) : '') + '</div>';
  }

  static _secretLabel(preset) {
    if (preset === 'slack') return 'Slack signing secret';
    if (preset === 'github') return 'GitHub webhook secret';
    return 'Auth token';
  }

  static _secretForm(label) {
    return '<div class="cm-trig-compose-row"><input type="password" class="cm-trig-secret" autocomplete="off" placeholder="paste the ' + esc(label.toLowerCase()) + '">'
      + '<button type="button" class="cm-sched-btn" data-act="secret-cancel">Cancel</button>'
      + '<button type="button" class="cm-sched-btn primary" data-act="secret-save">Save</button></div>';
  }
}
