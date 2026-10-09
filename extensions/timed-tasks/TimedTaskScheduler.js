const TaskFields = require('./TaskFields');

class TimedTaskScheduler {
  static TICK_MS = 30000;

  constructor({ repository, runner, now = () => Date.now() }) {
    this._repository = repository;
    this._runner = runner;
    this._now = now;
    this._timer = null;
    this._ticking = false;
  }

  start() {
    this.stop();
    this._timer = setInterval(() => { this.tick().catch(() => {}); }, TimedTaskScheduler.TICK_MS);
    if (typeof this._timer.unref === 'function') this._timer.unref();
  }

  stop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
  }

  async tick() {
    if (this._ticking) return;
    this._ticking = true;
    try {
      for (const task of this._dueTasks()) await this._runSafely(task);
    } finally {
      this._ticking = false;
    }
  }

  _dueTasks() {
    const now = this._now();
    return this._repository.enabled()
      .filter((t) => !this._runner.isRunning(t.id))
      .filter((t) => {
        if (!t.next_run) {
          this._repository.update(t.id, { next_run: TaskFields.nextRun(t.repeat_interval, now) });
          return false;
        }
        return new Date(t.next_run).getTime() <= now;
      });
  }

  async _runSafely(task) {
    try {
      console.log(`timed-tasks: executing "${task.name}" (${task.id})`);
      await this._runner.execute(task);
    } catch (err) {
      console.error(`timed-tasks: execution error for "${task.name}":`, err.message);
    }
  }
}

module.exports = TimedTaskScheduler;
