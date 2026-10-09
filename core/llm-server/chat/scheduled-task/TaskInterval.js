const ScheduledTaskStore = require('../ScheduledTaskStore');

class TaskInterval {
  static MIN_EVERY_MINUTES = Math.round(ScheduledTaskStore.MIN_INTERVAL_MS / 60000);
  static MAX_EVERY_MINUTES = Math.round(ScheduledTaskStore.MAX_INTERVAL_MS / 60000);

  static describe(ms) {
    const minutes = TaskInterval.toMinutes(ms);
    if (minutes % 1440 === 0) return TaskInterval._every(minutes / 1440, 'day', 'days');
    if (minutes % 60 === 0) return TaskInterval._every(minutes / 60, 'hour', 'hours');
    return `every ${minutes} minutes`;
  }

  static toMinutes(ms) {
    return Math.round(ms / 60000);
  }

  static fromMinutes(everyMinutes, fallbackMinutes) {
    return Math.round(Number(everyMinutes) || fallbackMinutes) * 60000;
  }

  static _every(count, one, many) {
    return count === 1 ? `every ${one}` : `every ${count} ${many}`;
  }
}

module.exports = TaskInterval;
