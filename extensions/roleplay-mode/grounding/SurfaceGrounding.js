const path = require('path');
const GroundingScope = require('./GroundingScope');
const BodySignals = require('./BodySignals');
const CharacterState = require('../world/CharacterState');

class SurfaceGrounding {
  static SCOPE = 'roleplay:surface';
  static PACK = 'surface';
  static PACK_DIR = path.join(__dirname, 'packs', 'surface');
  static PER_CHARACTER = 3;
  static CANDIDATES = 24;
  static STANDING_BONUS = 10;
  static STANDING_MAX = 2;
  static SYNTHETIC_WEIGHT = 3;
  static ANY = '*';

  constructor(opts = {}) {
    this._scope = new GroundingScope(Object.assign({ scope: SurfaceGrounding.SCOPE, dir: SurfaceGrounding.PACK_DIR, pack: SurfaceGrounding.PACK }, opts));
  }

  static shared() {
    if (!SurfaceGrounding._shared) SurfaceGrounding._shared = new SurfaceGrounding();
    return SurfaceGrounding._shared;
  }

  static enabled(data) {
    return !(data && data.options && data.options.surfaceGrounding === false);
  }

  get scope() {
    return this._scope;
  }

  sync() {
    return this._scope.sync();
  }

  async forMoment(characters, playerText) {
    const out = {};
    try {
      if (!this._scope.rag()) return out;
      await this._scope.sync();
      const list = (characters || []).filter((c) => c && c.id);
      const moments = SurfaceGrounding.attribute(list, playerText);
      const picked = [];
      for (const c of list) {
        const moment = moments.get(c.id) || ' ';
        if (!moment.trim() && !CharacterState.of(c).condition) continue;
        picked.push([c.id, await this.forCharacter(c, moment)]);
      }
      const owned = new Set(picked.flatMap(([, notes]) => notes.filter((n) => n.via === 'condition').map((n) => n.id)));
      for (const [id, notes] of picked) {
        const kept = notes.filter((n) => n.via !== 'word' || !owned.has(n.id)).map(({ via, ...n }) => n);
        if (kept.length) out[id] = kept;
      }
    } catch (_) {}
    return out;
  }

  async forCharacter(c, rawMoment) {
    const text = SurfaceGrounding.describe(c);
    const synthetic = BodySignals.tags(text);
    const body = GroundingScope.padded(text);
    const condition = GroundingScope.padded(CharacterState.of(c).condition);
    const query = [rawMoment.trim(), text].concat(synthetic).join(' ');
    const ranked = await this._scope.search(query, SurfaceGrounding.CANDIDATES);
    const scored = [];
    for (const { card, rank } of ranked) {
      const moment = SurfaceGrounding.without(rawMoment, card.unless);
      if (card.when.includes(SurfaceGrounding.ANY)) {
        if (GroundingScope.hits(card.unless, condition)) continue;
        const byCondition = GroundingScope.hits(card.tags.filter((t) => t !== SurfaceGrounding.ANY), condition);
        const byWord = GroundingScope.hits(card.when.filter((t) => t !== SurfaceGrounding.ANY), moment);
        if (byCondition || byWord) scored.push({ card, score: SurfaceGrounding.STANDING_BONUS + byCondition + byWord, rank, via: byCondition ? 'condition' : 'word' });
        continue;
      }
      const when = GroundingScope.hits(card.when, moment);
      if (!when) continue;
      const any = card.tags.includes(SurfaceGrounding.ANY);
      const tags = any ? 0 : GroundingScope.hits(card.tags, body, synthetic, SurfaceGrounding.SYNTHETIC_WEIGHT);
      if (!any && !tags) continue;
      scored.push({ card, score: tags * 2 + when + (any ? 0 : 1), rank });
    }
    scored.sort((a, b) => (b.score - a.score) || (a.rank - b.rank));
    const standing = scored.filter((s) => s.score >= SurfaceGrounding.STANDING_BONUS).slice(0, SurfaceGrounding.STANDING_MAX);
    const now = scored.filter((s) => s.score < SurfaceGrounding.STANDING_BONUS);
    return standing.concat(now).slice(0, SurfaceGrounding.PER_CHARACTER)
      .map(({ card, via }) => ({ id: card.id, title: card.title, body: card.body, via: via || 'moment' }));
  }

  static attribute(characters, text) {
    const out = new Map();
    const parts = String(text || '').split(/(?<=[.!?;])\s+|\s+(?:and then|then)\s+/i).filter((s) => s.trim());
    let last = characters.length === 1 ? characters.slice() : [];
    for (const part of parts) {
      const padded = GroundingScope.padded(part).replace(/ (?:my|mine|our) [a-z']+/g, ' ');
      const named = characters.filter((c) => SurfaceGrounding.named(c, padded));
      const owners = named.length ? named : last;
      if (named.length) last = named;
      for (const c of owners) out.set(c.id, (out.get(c.id) || ' ') + padded.trim() + ' ');
    }
    return out;
  }

  static without(paddedMoment, unless) {
    let s = paddedMoment;
    for (const phrase of unless || []) {
      const p = ' ' + String(phrase).replace(/[^a-z0-9']+/g, ' ').trim() + ' ';
      if (p.trim()) s = s.split(p).join(' ');
    }
    return s;
  }

  static named(c, paddedMoment) {
    const first = String((c && c.name) || '').trim().split(/\s+/)[0];
    if (!first) return false;
    return GroundingScope.hits([first.toLowerCase()], paddedMoment) > 0 || GroundingScope.hits([first.toLowerCase() + "'s"], paddedMoment) > 0;
  }

  static describe(c) {
    const p = (c && c.profile) || {};
    const st = CharacterState.of(c || {});
    return [c && c.description, c && c.appearance, p.summary, p.appearance, st.condition]
      .map((x) => String(x || '').trim()).filter(Boolean).join('. ');
  }
}

module.exports = SurfaceGrounding;
