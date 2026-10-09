export default class TimeText {
  static formatTime(iso) {
    if (!iso) return 'never';
    try {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return String(iso);
      return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(iso);
    }
  }

  static formatRelative(iso) {
    if (!iso) return '';
    const time = new Date(iso).getTime();
    if (Number.isNaN(time)) return '';
    const diff = time - Date.now();
    const [count, unit] = TimeText._unit(Math.abs(diff));
    return diff >= 0 ? `in ${count} ${unit}` : `${count} ${unit} ago`;
  }

  static _unit(abs) {
    if (abs < 60000) return [Math.round(abs / 1000), 's'];
    if (abs < 3600000) return [Math.round(abs / 60000), 'min'];
    if (abs < 86400000) return [Math.round(abs / 3600000), 'h'];
    return [Math.round(abs / 86400000), 'd'];
  }
}
