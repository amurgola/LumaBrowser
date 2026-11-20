class PlanSteps {
  static PENDING = 'pending';
  static IN_PROGRESS = 'in_progress';
  static COMPLETED = 'completed';

  static MAX_STEPS = 20;
  static TEXT_MAX = 200;

  static TEXT_KEYS = ['step', 'text', 'title', 'content', 'task', 'description', 'name'];

  static STATUS_WORDS = {
    pending: PlanSteps.PENDING, todo: PlanSteps.PENDING, notstarted: PlanSteps.PENDING, open: PlanSteps.PENDING,
    inprogress: PlanSteps.IN_PROGRESS, active: PlanSteps.IN_PROGRESS, current: PlanSteps.IN_PROGRESS,
    doing: PlanSteps.IN_PROGRESS, now: PlanSteps.IN_PROGRESS, running: PlanSteps.IN_PROGRESS, started: PlanSteps.IN_PROGRESS,
    completed: PlanSteps.COMPLETED, complete: PlanSteps.COMPLETED, done: PlanSteps.COMPLETED, finished: PlanSteps.COMPLETED,
  };

  static normalize(raw) {
    const list = PlanSteps._list(raw);
    if (!list) return null;
    const steps = list.map((entry) => PlanSteps._step(entry)).filter(Boolean).slice(0, PlanSteps.MAX_STEPS);
    if (list.length && !steps.length) return null;
    return PlanSteps._oneInProgress(steps);
  }

  static complete(steps, number) {
    const index = Number(number) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= steps.length) return null;
    return PlanSteps._oneInProgress(steps.map((step, at) => (at <= index ? { ...step, status: PlanSteps.COMPLETED } : step)));
  }

  static progress(steps) {
    const list = Array.isArray(steps) ? steps : [];
    const completed = list.filter((step) => step.status === PlanSteps.COMPLETED).length;
    return {
      total: list.length,
      completed,
      currentIndex: list.findIndex((step) => step.status === PlanSteps.IN_PROGRESS),
      done: list.length > 0 && completed === list.length,
    };
  }

  static _list(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw !== 'string' || !raw.trim().startsWith('[')) return null;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  static _step(entry) {
    const text = PlanSteps._text(entry);
    if (!text) return null;
    return { text: text.slice(0, PlanSteps.TEXT_MAX), status: PlanSteps._status(entry) };
  }

  static _text(entry) {
    if (typeof entry === 'string') return entry.trim();
    if (!entry || typeof entry !== 'object') return '';
    const key = PlanSteps.TEXT_KEYS.find((name) => typeof entry[name] === 'string' && entry[name].trim());
    return key ? entry[key].trim() : '';
  }

  static _status(entry) {
    const word = entry && typeof entry === 'object' ? entry.status ?? entry.state : null;
    const letters = String(word == null ? '' : word).toLowerCase().replace(/[^a-z]/g, '');
    return PlanSteps.STATUS_WORDS[letters] || PlanSteps.PENDING;
  }

  static _oneInProgress(steps) {
    const marked = steps.findIndex((step) => step.status === PlanSteps.IN_PROGRESS);
    const current = marked !== -1 ? marked : steps.findIndex((step) => step.status === PlanSteps.PENDING);
    return steps.map((step, index) => {
      if (step.status === PlanSteps.COMPLETED) return step;
      const status = index === current ? PlanSteps.IN_PROGRESS : PlanSteps.PENDING;
      return step.status === status ? step : { ...step, status };
    });
  }
}

module.exports = PlanSteps;
