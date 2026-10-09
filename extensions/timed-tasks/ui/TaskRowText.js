import IntervalPicker from '../../ui-kit/ui/IntervalPicker.js';
import TimeText from '../../ui-kit/ui/TimeText.js';

export default class TaskRowText {
  static SEPARATOR = ' · ';

  static dot(task) {
    if (task.status === 'running') return { cls: 'busy', title: 'Running now' };
    if (!task.enabled) return { cls: '', title: 'Paused' };
    if (task.last_status === 'error') return { cls: 'bad', title: 'Last run failed' };
    return { cls: 'ok', title: 'Active' };
  }

  static meta(task) {
    const parts = [IntervalPicker.format(task.repeat_interval)];
    if (task.status === 'running') parts.push('running now');
    else if (task.last_run) parts.push(`last ${TimeText.formatRelative(task.last_run)}`);
    else parts.push('never run');
    if (task.enabled && task.status !== 'running' && task.next_run) parts.push(`next ${TimeText.formatRelative(task.next_run)}`);
    return parts.join(TaskRowText.SEPARATOR);
  }

  static count(tasks) {
    const n = tasks.length;
    const active = tasks.filter((t) => t.enabled).length;
    if (n === 0) return 'No tasks';
    return `${n} task${n !== 1 ? 's' : ''}${active !== n ? `, ${active} active` : ''}`;
  }

  static next(tasks) {
    const running = tasks.filter((t) => t.status === 'running').length;
    if (running > 0) return `${running} running now`;
    const nextTask = TaskRowText._soonest(tasks.filter((t) => t.enabled));
    if (nextTask) return `Next: ${nextTask.name} ${TimeText.formatRelative(nextTask.next_run)}`;
    return tasks.length > 0 ? 'All tasks paused' : '';
  }

  static settingsSummary(tasks) {
    const n = tasks.length;
    const active = tasks.filter((t) => t.enabled).length;
    return n === 0 ? 'No tasks yet.' : `${n} task${n !== 1 ? 's' : ''}, ${active} active.`;
  }

  static _soonest(tasks) {
    let soonest = null;
    let soonestTime = Infinity;
    for (const t of tasks) {
      if (!t.next_run) continue;
      const time = new Date(t.next_run).getTime();
      if (time < soonestTime) { soonestTime = time; soonest = t; }
    }
    return soonest;
  }
}
