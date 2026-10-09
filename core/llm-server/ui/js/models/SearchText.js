export default class SearchText {
  static count(value) {
    const n = Number(value) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
    return String(n);
  }

  static fitLabel(fit) {
    const f = fit || {};
    return (f.label || '') + (f.speedLabel ? ' · ' + f.speedLabel : '');
  }
}
