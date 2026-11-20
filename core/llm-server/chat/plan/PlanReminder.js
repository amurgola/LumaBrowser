const PlanProgressText = require('./PlanProgressText');
const PlanSteps = require('./PlanSteps');

class PlanReminder {
  static HEAD = 'Your plan for this request (update_plan keeps it current):';

  static STALE = 'If the user now asks for something else, replace the plan, or clear it with an empty list.';

  static build(plan) {
    const steps = PlanReminder._unfinished(plan);
    if (!steps) return null;
    const lines = steps.map((step, index) => `${index + 1}. ${step.text} (${step.status})`);
    return ['<plan>', PlanReminder.HEAD, ...lines, `${PlanProgressText.nextCall(steps)} ${PlanReminder.STALE}`, '</plan>'].join('\n');
  }

  static status(plan) {
    const steps = PlanReminder._unfinished(plan);
    if (!steps) return null;
    return `[Plan. ${PlanProgressText.summary(steps)}. ${PlanProgressText.nextCall(steps)}]`;
  }

  static _unfinished(plan) {
    const steps = plan && Array.isArray(plan.steps) ? plan.steps : [];
    return steps.length && !PlanSteps.progress(steps).done ? steps : null;
  }
}

module.exports = PlanReminder;
