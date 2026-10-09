class TraceEventLabel {
  static describe(event, aggregate = false) {
    const d = (event.args && (event.args.data || event.args.beginData)) || {};
    switch (event.name) {
      case 'FunctionCall':
      case 'v8.callFunction':
        return TraceEventLabel._functionCall(event.name, d);
      case 'EventDispatch': return `EventDispatch ${d.type || ''}`.trim();
      case 'TimerFire': return aggregate ? 'TimerFire' : `TimerFire #${d.timerId ?? '?'}`;
      case 'Layout': return !aggregate && d.dirtyObjects != null ? `Layout (${d.dirtyObjects} dirty / ${d.totalObjects} total)` : 'Layout';
      case 'EvaluateScript': return `EvaluateScript ${TraceEventLabel.shortUrl(d.url)}`;
      case 'XHRReadyStateChange':
      case 'XHRLoad':
      case 'ResourceReceiveResponse':
      case 'ResourceFinish':
        return `${event.name} ${TraceEventLabel.shortUrl(d.url)}`;
      default: return event.name;
    }
  }

  static shortUrl(url) {
    if (!url) return '';
    const idx = url.lastIndexOf('/');
    return idx >= 0 ? url.slice(idx + 1) : url;
  }

  static _functionCall(name, d) {
    const where = d.url ? ` ${TraceEventLabel.shortUrl(d.url)}:${(d.lineNumber || 0) + 1}` : '';
    return `${name} ${d.functionName || '(anonymous)'}${where}`;
  }
}

module.exports = TraceEventLabel;
