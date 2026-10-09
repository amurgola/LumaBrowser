import VramIssue from './VramIssue.js';

export default class PreflightIssues {
  constructor() {
    this._boot = [];
    this._liveVram = new Map();
  }

  setBoot(issues) {
    this._boot = Array.isArray(issues) ? issues : [];
  }

  applyVramCard(card) {
    if (!card || !Number.isInteger(card.card)) return false;
    if (card.band === 'normal' || card.dismissed) {
      this._liveVram.delete(card.card);
      return false;
    }
    this._liveVram.set(card.card, card);
    return true;
  }

  seedVram(cards) {
    for (const card of cards || []) {
      if (card.band !== 'normal' && !card.dismissed) this._liveVram.set(card.card, card);
    }
    return this._liveVram.size > 0;
  }

  dismissVram(cardIndex) {
    this._liveVram.delete(cardIndex);
  }

  all() {
    const live = [...this._liveVram.values()].sort((a, b) => a.card - b.card).map(VramIssue.from);
    return this._boot.concat(live);
  }
}
