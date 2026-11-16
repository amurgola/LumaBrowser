import DownloadText from './DownloadText.js';

export default class DownloadGroups {
  static DAY_MS = 24 * 60 * 60 * 1000;

  static build(list, { query = '', now = Date.now(), locale = undefined } = {}) {
    const groups = [];
    for (const download of DownloadGroups._newestFirst(list, query)) {
      const label = DownloadGroups.dayLabel(download.startedAt, now, locale);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.downloads.push(download);
      else groups.push({ label, downloads: [download] });
    }
    return groups;
  }

  static matches(download, query) {
    const wanted = String(query || '').trim().toLowerCase();
    if (!wanted) return true;
    return [DownloadText.name(download), download.filename, download.url].some((text) => String(text || '').toLowerCase().includes(wanted));
  }

  static dayLabel(startedAt, now, locale) {
    if (!startedAt) return 'Earlier';
    const daysAgo = Math.round((DownloadGroups._startOfDay(now) - DownloadGroups._startOfDay(startedAt)) / DownloadGroups.DAY_MS);
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    return new Date(startedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  static _newestFirst(list, query) {
    return list.filter((download) => DownloadGroups.matches(download, query))
      .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
  }

  static _startOfDay(ms) {
    const day = new Date(ms);
    day.setHours(0, 0, 0, 0);
    return day.getTime();
  }
}
