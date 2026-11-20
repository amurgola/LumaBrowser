const PlanSteps = require('./PlanSteps');

class PlanProgressText {
  static CLEARED = 'Plan cleared.';
  static LAST_STEP = 'This is the last step: your final answer completes it.';

  static summary(steps) {
    const progress = PlanSteps.progress(steps);
    if (!progress.total) return PlanProgressText.CLEARED;
    if (progress.done) return `All ${progress.total} steps completed.`;
    return `Step ${progress.currentIndex + 1} of ${progress.total}: ${steps[progress.currentIndex].text}`;
  }

  static nextCall(steps) {
    const progress = PlanSteps.progress(steps);
    if (!progress.total || progress.done) return null;
    if (progress.currentIndex === progress.total - 1) return PlanProgressText.LAST_STEP;
    return `When this step is finished, call update_plan with {"done": ${progress.currentIndex + 1}} before starting the next step.`;
  }
}

module.exports = PlanProgressText;
