export default class DownloadText {
  static bytes(n) {
    if (!n || n < 0) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  static status(d) {
    if (d.state === 'progress') {
      if (d.total) return `${DownloadText.bytes(d.received)} of ${DownloadText.bytes(d.total)}`;
      return d.received ? `${DownloadText.bytes(d.received)} so far` : 'Starting';
    }
    if (d.state === 'done') return d.missing ? 'Deleted' : 'Done';
    if (d.state === 'failed') return 'Failed';
    if (d.state === 'cancelled') return 'Cancelled';
    return '';
  }

  static pageStatus(d) {
    if (d.state === 'done' && !d.missing) return DownloadText.bytes(d.total || d.received) || 'Done';
    return DownloadText.status(d);
  }

  static name(d) {
    const saved = String(d.savePath || '').split(/[\\/]/).pop();
    return saved || d.filename || 'Download';
  }

  static source(d) {
    try {
      const url = new URL(d.url);
      return /^https?:$/.test(url.protocol) ? url.hostname.replace(/^www\./, '') : '';
    } catch (_) {
      return '';
    }
  }

  static percent(d) {
    if (d.state === 'progress' && d.total) return Math.min(100, Math.round((d.received / d.total) * 100));
    return d.state === 'done' ? 100 : 0;
  }

  static aggregatePercent(active) {
    const total = active.reduce((s, d) => s + (d.total || 0), 0);
    const received = active.reduce((s, d) => s + (d.received || 0), 0);
    return total ? Math.min(100, Math.round((received / total) * 100)) : 0;
  }
}
