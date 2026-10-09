const path = require('path');
const FrameHash = require('./FrameHash');
const GameBriefing = require('./GameBriefing');
const GameMacroStep = require('./GameMacroStep');

class GameSession {
  static STUCK_STEPS = 5;
  static STUCK_DISTANCE = 6;
  static SUMMARY_EVERY = 100;
  static MAX_NOTES = 200;
  static MAX_MACROS = 50;
  static MAX_MACRO_STEPS = 50;
  static GOAL_KEYS = ['primary', 'secondary', 'tertiary'];

  constructor(profile, persist) {
    this.profile = profile;
    this._persist = persist;
    this.hwnd = null;
    this.lastHash = null;
    this._recentHashes = [];
    this._recentActions = [];
  }

  get gameId() {
    return this.profile.gameId;
  }

  save() {
    this.profile.updatedAt = new Date().toISOString();
    this._persist(this.profile);
  }

  isAllowedFor(exe) {
    const { allowed, allowedExe } = this.profile;
    if (!allowed || !allowedExe || !exe) return false;
    return path.normalize(allowedExe).toLowerCase() === path.normalize(exe).toLowerCase();
  }

  allow(exe) {
    if (!exe) throw new Error('Cannot allow a game whose executable is unknown.');
    this.profile.allowed = true;
    this.profile.allowedExe = exe;
    this.save();
  }

  setGoals(goals = {}) {
    for (const key of GameSession.GOAL_KEYS) {
      if (goals[key] != null) this.profile.goals[key] = String(goals[key]).slice(0, 1000);
    }
    this.save();
    return this.profile.goals;
  }

  addNote({ text, kind = 'note', key, action } = {}) {
    if (kind === 'control' && key && action) this._recordControl(key, action);
    this._appendNote(String(text || '').trim(), kind);
    if (kind === 'summary') this.profile.lastSummaryStep = this.profile.stepCount;
    this.save();
  }

  saveMacro(name, steps) {
    const normalized = String(name || '').trim().toLowerCase();
    GameSession._validateMacro(normalized, steps);
    this._requireMacroRoom(normalized);
    this.profile.macros[normalized] = steps;
    this.save();
    return normalized;
  }

  getMacro(name) {
    return this.profile.macros[String(name || '').trim().toLowerCase()] || null;
  }

  recordStep({ hash = null, action = '' } = {}) {
    this.profile.stepCount += 1;
    GameSession._pushCapped(this._recentActions, action);
    if (hash) {
      this.lastHash = hash;
      GameSession._pushCapped(this._recentHashes, hash);
    }
    this.save();
    return this.status();
  }

  isStuck() {
    const h = this._recentHashes;
    if (h.length < GameSession.STUCK_STEPS) return false;
    return h.every((x) => FrameHash.hamming(h[0], x) < GameSession.STUCK_DISTANCE);
  }

  summarizeDue() {
    return this.profile.stepCount - this.profile.lastSummaryStep >= GameSession.SUMMARY_EVERY;
  }

  status() {
    const out = { stepCount: this.profile.stepCount, stuck: this.isStuck(), summarizeDue: this.summarizeDue() };
    if (out.stuck) out.suggestion = this._stuckSuggestion();
    if (out.summarizeDue) out.summaryHint = GameSession._summaryHint();
    return out;
  }

  describe() {
    return GameBriefing.describe(this.profile);
  }

  _recordControl(key, action) {
    this.profile.controls[String(key).toLowerCase()] = String(action).slice(0, 200);
  }

  _appendNote(text, kind) {
    if (!text) return;
    const notes = this.profile.notes;
    notes.push({ at: this.profile.stepCount, kind, text: text.slice(0, 2000) });
    if (notes.length > GameSession.MAX_NOTES) notes.splice(0, notes.length - GameSession.MAX_NOTES);
  }

  _requireMacroRoom(name) {
    const isNew = !this.profile.macros[name];
    if (isNew && Object.keys(this.profile.macros).length >= GameSession.MAX_MACROS) {
      throw new Error(`At most ${GameSession.MAX_MACROS} macros per game; overwrite or reuse one.`);
    }
  }

  _stuckSuggestion() {
    const tried = [...new Set(this._recentActions.filter(Boolean))].join(', ');
    return `The screen has not changed for ${GameSession.STUCK_STEPS} steps${tried ? ` (tried: ${tried})` : ''}. `
      + 'Stop repeating those. Take a screenshot and look for a dialog or menu, try Esc or Enter, '
      + 'click somewhere else, check the controls in the profile, or save a note about what does not work.';
  }

  static _summaryHint() {
    return `It has been ${GameSession.SUMMARY_EVERY}+ steps since the last summary: write one with game_note kind "summary" `
      + '(where you are, what you learned, what is next) so progress survives a context reset.';
  }

  static _validateMacro(name, steps) {
    if (!/^[a-z0-9_-]{1,40}$/.test(name)) throw new Error('Macro name: 1-40 characters of a-z, 0-9, _ or -.');
    if (!Array.isArray(steps) || !steps.length) throw new Error('steps must be a non-empty array.');
    if (steps.length > GameSession.MAX_MACRO_STEPS) throw new Error(`At most ${GameSession.MAX_MACRO_STEPS} steps per macro.`);
    steps.forEach(GameMacroStep.validate);
  }

  static _pushCapped(list, value) {
    list.push(value);
    if (list.length > GameSession.STUCK_STEPS) list.shift();
  }
}

module.exports = GameSession;
