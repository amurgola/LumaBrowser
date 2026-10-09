import IntervalPicker from '../../../ui-kit/ui/IntervalPicker.js';
import TimeText from '../../../ui-kit/ui/TimeText.js';

export default class SourceStatus {
  static dotClass(source) {
    if (!source || !source.lastSyncAt) return '';
    return source.lastStatus === 'error' ? 'bad' : 'ok';
  }

  static text(source) {
    if (!source) return '';
    if (!source.enabled) return 'Paused';
    const every = IntervalPicker.format(source.intervalMs);
    if (!source.lastSyncAt) return `Not synced yet${every ? `, ${every}` : ''}`;
    const when = TimeText.formatRelative(source.lastSyncAt) || TimeText.formatTime(source.lastSyncAt);
    if (source.lastStatus === 'error') return `Failed ${when}: ${source.lastError || 'unknown error'}`;
    return `Synced ${when}${every ? `, ${every}` : ''}`;
  }
}
