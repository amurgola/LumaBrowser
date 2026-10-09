export default class ActivityText {
  static duration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)}s`;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }

  static shortCaller(caller) {
    if (!caller) return '';
    return caller.replace(/^ext\./, '').replace(/^core\./, 'core: ');
  }

  static details(details) {
    if (details == null) return '(none)';
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  }

  static resultClass(result) {
    return result ? `al-result-${result}` : 'al-result-info';
  }
}
