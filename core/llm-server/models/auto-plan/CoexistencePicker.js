const LlmTierPicker = require('./LlmTierPicker');

class CoexistencePicker {
  static coexists(cardBudgets, llmNeed, imgNeed) {
    const rooms = cardBudgets.slice().sort((a, b) => b - a);
    let remaining = llmNeed;
    for (let i = 0; i < rooms.length && remaining > 0; i++) {
      const take = Math.min(rooms[i], remaining);
      rooms[i] -= take;
      remaining -= take;
    }
    if (remaining > 0) return false;
    return rooms.some((room) => room >= imgNeed);
  }

  static residentPick(models, cardBudgets, vramTotal, imgNeed) {
    return CoexistencePicker._stepDown(cardBudgets, vramTotal, imgNeed, (budget) => LlmTierPicker.fullVram(models, budget));
  }

  static moePick(models, cardBudgets, vramTotal, ramBudget, imgNeed) {
    return CoexistencePicker._stepDown(
      cardBudgets, vramTotal, imgNeed, (budget) => LlmTierPicker.moeOffload(models, budget, ramBudget),
    );
  }

  static _stepDown(cardBudgets, vramTotal, imgNeed, pickWithin) {
    let budget = Math.max(0, vramTotal - imgNeed);
    for (;;) {
      const pick = pickWithin(budget);
      if (!pick) return null;
      if (CoexistencePicker.coexists(cardBudgets, pick.vramNeedBytes, imgNeed)) return pick;
      budget = pick.vramNeedBytes - 1;
    }
  }
}

module.exports = CoexistencePicker;
