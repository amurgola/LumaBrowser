export default class PlanExplainerOpener {
  static POLL_MS = 250;
  static GIVE_UP_MS = 8000;

  static open(doc = document) {
    const started = Date.now();
    const tick = () => {
      if (PlanExplainerOpener._tryOpen(doc)) return;
      if (Date.now() - started < PlanExplainerOpener.GIVE_UP_MS) setTimeout(tick, PlanExplainerOpener.POLL_MS);
    };
    tick();
  }

  static _tryOpen(doc) {
    const card = doc.getElementById('cardPlanExplainer');
    const details = card && !card.hidden ? card.querySelector('.plan-notes-details') : null;
    if (!details) return false;
    details.open = true;
    try { card.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (_) {}
    return true;
  }
}
