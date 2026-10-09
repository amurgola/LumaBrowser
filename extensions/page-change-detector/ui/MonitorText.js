import IntervalPicker from '../../ui-kit/ui/IntervalPicker.js';
import TimeText from '../../ui-kit/ui/TimeText.js';

export default class MonitorText {
  static SEPARATOR = ' · ';

  static JITTER_CHOICES = ['0', '10', '25', '50'];

  static dot(m) {
    if (m.status === 'checking') return { cls: 'busy', title: 'Checking now' };
    if (!m.enabled) return { cls: '', title: 'Paused' };
    if (m.last_status === 'error') return { cls: 'bad', title: 'Last check failed' };
    return { cls: 'ok', title: 'Active' };
  }

  static meta(m) {
    const parts = [IntervalPicker.format(m.check_interval_ms) + (m.interval_jitter_percent ? ` ±${m.interval_jitter_percent}%` : '')];
    if (m.status === 'checking') parts.push('checking now');
    else if (m.last_run) parts.push(`checked ${TimeText.formatRelative(m.last_run)}`);
    else parts.push('not checked yet');
    if (m.enabled && m.status !== 'checking' && m.next_run) parts.push(`next ${TimeText.formatRelative(m.next_run)}`);
    return parts.join(MonitorText.SEPARATOR);
  }

  static panelCount(monitors) {
    const n = monitors.length;
    const active = monitors.filter((m) => m.enabled).length;
    if (n === 0) return 'No monitors';
    return `${n} monitor${n !== 1 ? 's' : ''}${active !== n ? `, ${active} active` : ''}`;
  }

  static panelStatus(monitors) {
    const checkingNow = monitors.filter((m) => m.status === 'checking').length;
    if (checkingNow > 0) return `${checkingNow} checking now`;
    if (monitors.length === 0) return '';
    const totalChanges = monitors.reduce((sum, m) => sum + (m.change_count || 0), 0);
    const failing = monitors.filter((m) => m.enabled && m.last_status === 'error').length;
    const bits = [`${totalChanges} change${totalChanges !== 1 ? 's' : ''} detected`];
    if (failing > 0) bits.push(`${failing} failing`);
    return bits.join(MonitorText.SEPARATOR);
  }

  static settingsSummary(monitors) {
    const n = monitors.length;
    const active = monitors.filter((m) => m.enabled).length;
    return n === 0 ? 'No monitors yet.' : `${n} monitor${n !== 1 ? 's' : ''}, ${active} active.`;
  }

  static host(url) {
    try {
      const parsed = new URL(url);
      return parsed.host + parsed.pathname.replace(/\/$/, '');
    } catch (_) {
      return url;
    }
  }

  static jitterChoice(monitor) {
    const j = monitor ? Number(monitor.interval_jitter_percent || 0) : 0;
    if (MonitorText.JITTER_CHOICES.includes(String(j))) return String(j);
    return j > 0 ? '25' : '0';
  }
}
