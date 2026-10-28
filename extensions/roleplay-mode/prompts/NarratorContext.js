const SceneLocator = require('../world/SceneLocator');
const CastResolver = require('../world/CastResolver');
const CharacterProfile = require('../world/CharacterProfile');
const CharacterChronicle = require('../world/CharacterChronicle');
const CharacterState = require('../world/CharacterState');
const StoryLedger = require('../world/StoryLedger');
const NarratorBrief = require('./NarratorBrief');
const PromptBudget = require('./PromptBudget');
const HistoryTrimmer = require('./HistoryTrimmer');

class NarratorContext {
  static PRESENT_MAX = 6;
  static OFFSTAGE_MAX = 8;
  static RECENT_EVENTS = 8;
  static THREADS_MAX = 5;

  static build(data, { messages = [], contextWindow = null } = {}) {
    const d = data || {};
    const window = PromptBudget.window(d, contextWindow);
    const cast = NarratorContext.cast(d);
    const scene = SceneLocator.active(d);
    const emptyWorld = !cast.present.length && !cast.offstage.length && !scene;
    const systemPrompt = [
      ...NarratorContext._brief(d, emptyWorld, window),
      ...NarratorContext._premise(d, window),
      ...NarratorContext._story(d, window),
      ...NarratorContext._present(d, cast.present, window),
      ...NarratorContext._offstage(d, cast.offstage, window),
      ...NarratorContext._setting(scene, cast.present, window),
    ].join('\n');
    const trimmed = HistoryTrimmer.trim(messages, PromptBudget.historyTokens(window));
    return {
      systemPrompt,
      postHistoryPrompt: NarratorContext._anchor(d, cast.present, window),
      messages: trimmed.messages,
      window,
      dropped: trimmed.dropped,
    };
  }

  static cast(data) {
    const chars = (Array.isArray(data.characters) ? data.characters : []).filter((c) => c && c.name);
    const tracked = CastResolver.currentEntries(data);
    let present;
    if (tracked.length) {
      present = tracked.map((e) => e.char);
    } else if (!data.currentState || !Array.isArray(data.currentState.characters) || !data.currentState.characters.length) {
      present = chars.filter((c) => !(c.state && typeof c.state === 'object' && c.state.present === false));
    } else {
      present = [];
    }
    present = present.slice(0, NarratorContext.PRESENT_MAX);
    const ids = new Set(present.map((c) => c.id));
    const offstage = chars.filter((c) => !ids.has(c.id))
      .sort((a, b) => NarratorContext._lastTurn(b) - NarratorContext._lastTurn(a))
      .slice(0, NarratorContext.OFFSTAGE_MAX);
    return { present, offstage };
  }

  static _brief(d, emptyWorld, window) {
    const player = StoryLedger.protagonist(d).name;
    return NarratorBrief.lines(d, { emptyWorld, playerName: player });
  }

  static _premise(d, window) {
    const cap = PromptBudget.layerTokens('premise', window);
    const lines = ['', '## Premise', PromptBudget.clip(d.scenario || '(No premise was provided; improvise a fitting one.)', cap)];
    const tone = String(d.tone || '').trim();
    if (tone) lines.push('', '## Tone', PromptBudget.clip(tone, 80));
    const p = StoryLedger.protagonist(d);
    if (p.name || p.appearance || p.persona) {
      const bits = [p.name || 'The player'];
      if (p.pronouns) bits.push('(' + p.pronouns + ')');
      const who = bits.join(' ') + (p.persona ? ': ' + p.persona : '') + (p.appearance ? '; looks: ' + p.appearance : '');
      lines.push('', '## The player', PromptBudget.clip(who, 120), 'Other characters see and remember the player as described here.');
    }
    return lines;
  }

  static _story(d, window) {
    const story = StoryLedger.of(d);
    const cap = PromptBudget.layerTokens('story', window);
    const recent = StoryLedger.unsummarised(d).slice(-NarratorContext.RECENT_EVENTS);
    if (!story.summary && !recent.length && story.turn === 0) return [];
    const lines = ['', '## Story so far', 'Now: ' + StoryLedger.clockLine(d) + '.'];
    if (story.summary) lines.push(PromptBudget.clip(story.summary, Math.round(cap * 0.7)));
    if (recent.length) {
      lines.push('Recent events:');
      for (const r of recent) lines.push('- ' + r.text);
    }
    const threads = StoryLedger.openThreads(d).slice(-NarratorContext.THREADS_MAX);
    if (threads.length) lines.push('Open threads: ' + threads.join('; ') + '.');
    return lines;
  }

  static _present(d, present, window) {
    if (!present.length) return [];
    const cap = PromptBudget.layerTokens('card', window);
    const lines = ['', '## In the scene now'];
    for (const c of present) lines.push(PromptBudget.clip(NarratorContext.card(c), cap));
    lines.push('Keep each of them consistent with their card, voice and tells; wardrobe and looks as noted.');
    return lines;
  }

  static card(c) {
    const p = CharacterProfile.of(c);
    const st = CharacterState.of(c);
    const ch = CharacterChronicle.of(c);
    const head = ['**' + c.name + '**'];
    if (p.summary) head.push(p.summary);
    const lines = [head.join(': ')];
    if (p.appearance) lines.push('  looks: ' + p.appearance);
    const outfit = (c.currentOutfitDesc || '').trim();
    if (outfit) lines.push('  wearing: ' + outfit);
    if (p.voice) lines.push('  voice: ' + p.voice);
    if (p.tells.length) lines.push('  tells: ' + p.tells.join('; '));
    if (p.wants) lines.push('  wants: ' + p.wants);
    if (p.hides) lines.push('  hides (never states it outright): ' + p.hides);
    const bond = st.bondUser || p.bonds[CharacterProfile.BOND_USER];
    if (bond) lines.push('  toward the player: ' + bond + (st.bondNote ? ' (' + st.bondNote + ')' : ''));
    const others = Object.entries(p.bonds).filter(([k]) => k !== CharacterProfile.BOND_USER).map(([k, v]) => k + ': ' + v);
    if (others.length) lines.push('  with others: ' + others.join('; '));
    if (ch.arc) lines.push('  so far: ' + ch.arc);
    const recent = CharacterChronicle.recent(c);
    if (recent.length) lines.push('  lately: ' + recent.map((b) => b.text).join(' '));
    const now = [st.emotion, st.posture, st.intent ? 'wants right now: ' + st.intent : '', st.condition ? 'condition: ' + st.condition : ''].filter(Boolean);
    if (now.length) lines.push('  now: ' + now.join('; '));
    return lines.join('\n');
  }

  static _offstage(d, offstage, window) {
    if (!offstage.length) return [];
    const each = PromptBudget.layerTokens('offstage', window);
    const total = PromptBudget.layerTokens('offstageTotal', window);
    const lines = ['', '## Off stage'];
    let used = 0;
    for (const c of offstage) {
      const line = PromptBudget.clip(NarratorContext.offstageLine(d, c), each);
      used += PromptBudget.estimate(line);
      if (used > total) break;
      lines.push(line);
    }
    lines.push('They are not in the immediate action unless the player seeks them out or the story brings them in.');
    return lines;
  }

  static offstageLine(d, c) {
    const p = CharacterProfile.of(c);
    const st = CharacterState.of(c);
    const scene = st.lastSeen && st.lastSeen.sceneId ? (d.scenes || []).find((s) => s.id === st.lastSeen.sceneId) : null;
    const bits = ['- **' + c.name + '**' + (p.summary ? ': ' + p.summary : '')];
    const where = CharacterState.absentLine(c, scene ? scene.name : '');
    if (where) bits.push(where);
    const bond = st.bondUser || p.bonds[CharacterProfile.BOND_USER];
    if (bond) bits.push('toward the player: ' + bond);
    return bits.join('; ');
  }

  static _setting(scene, present, window) {
    if (!scene) return [];
    const cap = PromptBudget.layerTokens('setting', window);
    const lines = ['', '## Setting', PromptBudget.clip(SceneLocator.label(scene), cap)];
    if (scene.memory) lines.push('Here before: ' + PromptBudget.clip(scene.memory, 80));
    lines.push('The environment only; the characters above inhabit it. Keep the action here until the player moves on.');
    return lines;
  }

  static _anchor(d, present, window) {
    const cap = PromptBudget.layerTokens('anchor', window);
    const mode = NarratorBrief.LENGTH_MODES[NarratorBrief.lengthMode(d)];
    const lines = ['[Scene notes for this reply]'];
    for (const c of present) {
      const bits = [CharacterState.line(c), (c.currentOutfitDesc || '').trim() ? 'wearing ' + c.currentOutfitDesc.trim() : ''].filter(Boolean);
      lines.push('- ' + c.name + (bits.length ? ': ' + bits.join('; ') : ''));
    }
    const threads = StoryLedger.openThreads(d).slice(-3);
    if (threads.length) lines.push('Open: ' + threads.join('; ') + '.');
    lines.push(mode.words + ', one beat, end on a handoff, the player\'s choices stay theirs.');
    return PromptBudget.clip(lines.join('\n'), cap);
  }

  static _lastTurn(c) {
    const st = CharacterState.of(c);
    const beats = CharacterChronicle.of(c).beats;
    const beatTurn = beats.length ? Number(beats[beats.length - 1].turn) || 0 : 0;
    return Math.max(st.lastSeen ? st.lastSeen.turn : 0, beatTurn);
  }
}

module.exports = NarratorContext;
