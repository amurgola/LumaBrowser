export default class RunTimeText {
  static when(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      });
    } catch (_) {
      return '';
    }
  }

  static every(ms) {
    const m = Math.round((ms || 0) / 60000);
    if (m >= 1440 && m % 1440 === 0) {
      const d = m / 1440;
      return d === 1 ? 'Every day' : 'Every ' + d + ' days';
    }
    if (m >= 60 && m % 60 === 0) {
      const h = m / 60;
      return h === 1 ? 'Every hour' : 'Every ' + h + ' hours';
    }
    return 'Every ' + Math.max(1, m) + ' minutes';
  }

  static duration(startIso, endIso) {
    if (!startIso || !endIso) return '';
    const s = Math.max(0, Math.round((new Date(endIso) - new Date(startIso)) / 1000));
    if (s < 60) return s + 's';
    return Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's';
  }
}
