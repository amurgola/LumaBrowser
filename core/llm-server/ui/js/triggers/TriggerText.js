export default class TriggerText {
  static PREVIEW_CHARS = 220;
  static URL_SCOPES = ['public', 'lan', 'local'];

  static when(iso, now = Date.now()) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const diff = now - date.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.round(diff / 60000) + ' min ago';
    if (diff < 86400000) return Math.round(diff / 3600000) + ' h ago';
    return date.toLocaleDateString();
  }

  static preview(sample) {
    if (!sample) return '';
    if (sample.event && sample.name) return TriggerText._clip(TriggerText._fileLine(sample));
    const body = sample.body != null ? sample.body : (sample.bodyText != null ? sample.bodyText : sample);
    let text;
    try { text = typeof body === 'string' ? body : JSON.stringify(body); } catch (_) { text = String(body); }
    return TriggerText._clip(text);
  }

  static hookUrls(trigger, baseUrls) {
    if (!trigger || !trigger.hookToken || !baseUrls) return [];
    return TriggerText.URL_SCOPES
      .filter((key) => baseUrls[key])
      .map((key) => ({ key, url: String(baseUrls[key]).replace(/\/+$/, '') + '/hooks/' + trigger.hookToken }));
  }

  static headline(trigger, running) {
    if (running) return { cls: 'running', text: 'Running…' };
    const kind = trigger.kind;
    switch (trigger.status) {
      case 'awaiting_sample': return { cls: 'listening', text: TriggerText._listeningText(kind) };
      case 'needs_test': return { cls: 'idle', text: 'Sample captured. Not tested yet' };
      case 'tested': return { cls: 'ready', text: 'Test passed. Ready to arm' };
      case 'armed': return { cls: 'armed', text: TriggerText._armedText(kind) };
      case 'auto_paused': return { cls: 'error', text: 'Paused after repeated failures' };
      default: return { cls: 'idle', text: trigger.status || '' };
    }
  }

  static _listeningText(kind) {
    if (kind === 'file') return 'Watching the folder for a sample file';
    if (kind === 'page') return 'Waiting for the page to change';
    if (kind === 'notification') return 'Listening for a sample notification';
    return 'Listening for a sample event';
  }

  static _armedText(kind) {
    if (kind === 'file' || kind === 'page') return 'Armed and watching';
    if (kind === 'notification') return 'Armed and listening';
    return 'Armed and live';
  }

  static _fileLine(sample) {
    const head = sample.name + (sample.size != null ? ' (' + sample.size + ' B)' : '') + ': ';
    const text = sample.preview != null ? String(sample.preview).replace(/\s+/g, ' ').trim() : (sample.isText === false ? 'binary' : '');
    return head + text;
  }

  static _clip(text) {
    return text.length > TriggerText.PREVIEW_CHARS ? text.slice(0, TriggerText.PREVIEW_CHARS - 1) + '…' : text;
  }
}
