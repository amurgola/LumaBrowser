const SceneLocator = require('../world/SceneLocator');
const CastResolver = require('../world/CastResolver');
const CharacterProfile = require('../world/CharacterProfile');
const CharacterChronicle = require('../world/CharacterChronicle');
const CharacterState = require('../world/CharacterState');
const StoryLedger = require('../world/StoryLedger');
const NarratorBrief = require('./NarratorBrief');
const PromptBudget = require('./PromptBudget');
const HistoryTrimmer = require('./HistoryTrimmer');
const BodyNotes = require('./BodyNotes');
const CharacterMarks = require('../world/CharacterMarks');
const CastRole = require('../world/CastRole');
const LedgerRecall = require('../world/LedgerRecall');
const NarratorThinking = require('../mode/NarratorThinking');

class NarratorContext {
  static PRESENT_MAX = 6;
  static OFFSTAGE_MAX = 8;
  static RECENT_EVENTS = 8;
  static THREADS_MAX = 5;
  static ANCHOR_THREADS = 3;
  static ANCHOR_PER_CHARACTER = 40;
  static PRESSURE_TOKENS = 45;

  static STATE_OPEN = '[Story state for this reply. Your notes as narrator, not part of the player\'s message.]';

  static build(data, { messages = [], contextWindow = null, grounding = null, surface = null, stateInHead = false } = {}) {
    const d = data || {};
    const window = PromptBudget.window(d, contextWindow);
    const cast = NarratorContext.cast(d);
    const scene = SceneLocator.active(d);
    const emptyWorld = !cast.present.length && !cast.offstage.length && !scene;
    const head = [
      ...NarratorContext._brief(d, emptyWorld, window),
      ...NarratorContext._premise(d, window),
      ...BodyNotes.lines(grounding, cast.present, window),
    ].join('\n');
    const state = [
      ...NarratorContext._story(d, window, { query: NarratorContext.playerMove(messages), present: cast.present }),
      ...NarratorContext._present(d, cast.present, window, surface),
      ...BodyNotes.surfaceLines(surface, cast.present, window),
      ...NarratorContext._offstage(d, cast.offstage, window),
      ...NarratorContext._setting(scene, cast.present, window),
    ].join('\n').trim();
    const contextText = state ? head + '\n\n' + state : head;
    const systemPrompt = stateInHead ? contextText : head;
    const turnPrompt = state && !stateInHead ? NarratorContext.STATE_OPEN + '\n' + state : '';
    const postHistoryPrompt = NarratorContext._anchor(d, cast.present, window, grounding, NarratorContext.playerMove(messages));
    const clean = HistoryTrimmer.withoutDebris(messages);
    const trimmed = HistoryTrimmer.trim(clean.messages, PromptBudget.historyFor(window, systemPrompt, turnPrompt + postHistoryPrompt));
    return {
      wordCap: NarratorContext.wordCap(d, NarratorBrief.LENGTH_MODES[NarratorBrief.lengthMode(d)], NarratorContext.playerMove(messages)),
      systemPrompt,
      turnPrompt,
      postHistoryPrompt,
      contextText,
      messages: trimmed.messages,
      window,
      dropped: trimmed.dropped,
      cleaned: clean.cleaned,
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

  static _story(d, window, { query = '', present = [] } = {}) {
    const story = StoryLedger.of(d);
    const cap = PromptBudget.layerTokens('story', window);
    const recent = StoryLedger.unsummarised(d).slice(-NarratorContext.RECENT_EVENTS);
    if (!story.summary && !recent.length && story.turn === 0) return [];
    const lines = ['', '## Story so far', 'Now: ' + StoryLedger.clockLine(d) + '.'];
    if (story.summary) lines.push(PromptBudget.clip(story.summary, Math.round(cap * 0.7)));
    const recalled = LedgerRecall.pick(story.ledger, { query, present: present.map((c) => c.name), exclude: recent, turn: story.turn });
    if (recalled.length) {
      lines.push('From earlier, relevant now:');
      for (const r of recalled) lines.push('- (turn ' + r.turn + ') ' + r.text);
    }
    if (recent.length) {
      lines.push('Recent events:');
      for (const r of recent) lines.push('- ' + r.text);
    }
    const threads = StoryLedger.openThreads(d).slice(NarratorContext.ANCHOR_THREADS, NarratorContext.THREADS_MAX);
    if (threads.length) lines.push('Other open threads: ' + threads.join('; ') + '.');
    return lines;
  }

  static _present(d, present, window, surface = null) {
    if (!present.length) return [];
    const cap = PromptBudget.layerTokens('card', window);
    const lines = ['', '## In the scene now'];
    const turn = StoryLedger.of(d).turn;
    for (const c of present) {
      const upClose = !!(surface && Array.isArray(surface[c.id]) && surface[c.id].length);
      lines.push(PromptBudget.clip(NarratorContext.card(c, { marks: !upClose, turn, state: false }), cap));
    }
    lines.push('Cards are for consistency, not material: keep voice, looks and wardrobe as noted, and leave the rest '
      + 'unsaid until the story reaches it.');
    return lines;
  }

  static HISTORY_TURNS = 2;

  static card(c, { marks: withMarks = true, turn = 0, state: withState = true } = {}) {
    const p = CharacterProfile.of(c);
    const st = CharacterState.of(c);
    const ch = CharacterChronicle.of(c);
    const head = ['**' + c.name + '**'];
    if (p.summary) head.push(p.summary);
    const outfit = (c.currentOutfitDesc || '').trim();
    if (CastRole.isWalkOn(c)) {
      const bits = [head.join(': ') + ' (in the background)'];
      if (p.appearance) bits.push('looks: ' + p.appearance);
      if (outfit && withState) bits.push('wearing: ' + outfit);
      return bits.join('; ');
    }
    const lines = [head.join(': ')];
    if (p.appearance) lines.push('  looks: ' + p.appearance);
    const marks = withMarks ? CharacterMarks.line(c) : '';
    if (marks) lines.push('  noticed since: ' + marks);
    if (outfit && withState) lines.push('  wearing: ' + outfit);
    if (p.voice) lines.push('  voice: ' + p.voice);
    const now = [st.emotion, st.posture, st.intent ? 'wants right now: ' + st.intent : '', st.condition ? 'condition: ' + st.condition : ''].filter(Boolean);
    if (now.length && withState) lines.push('  now: ' + now.join('; '));
    const bond = st.bondUser || p.bonds[CharacterProfile.BOND_USER];
    if (bond && (withState || !st.bondUser)) lines.push('  toward the player: ' + bond + (st.bondNote ? ' (' + st.bondNote + ')' : ''));
    if (p.wants) lines.push('  wants: ' + p.wants);
    if (p.tells.length) lines.push('  habits: ' + p.tells.join('; '));
    const others = Object.entries(p.bonds).filter(([k]) => k !== CharacterProfile.BOND_USER).map(([k, v]) => k + ': ' + v);
    if (others.length) lines.push('  with others: ' + others.join('; '));
    if (ch.arc) lines.push('  so far: ' + ch.arc);
    const cutoff = (Number(turn) || 0) - NarratorContext.HISTORY_TURNS;
    const earlier = CharacterChronicle.recent(c).filter((b) => !turn || (Number(b.turn) || 0) <= cutoff);
    if (earlier.length) lines.push('  earlier: ' + earlier.map((b) => b.text).join(' '));
    if (p.history) lines.push('  background (off the page until the story reaches it): ' + p.history);
    if (p.hides) lines.push('  keeps private (no hints): ' + p.hides);
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
    const where = CharacterState.absentLine(c, scene ? scene.name : '');
    const bits = ['- **' + c.name + '**' + (where ? ': ' + where : '')];
    const bond = st.bondUser || p.bonds[CharacterProfile.BOND_USER];
    if (bond) bits.push('toward the player: ' + bond);
    if (p.summary) bits.push(p.summary);
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

  static _anchor(d, present, window, grounding = null, move = '') {
    const labels = present.map((c) => BodyNotes.label(grounding, c)).join(' ');
    const cap = PromptBudget.layerTokens('anchor', window) + (labels.trim() ? PromptBudget.estimate(labels) + 4 : 0)
      + present.length * NarratorContext.ANCHOR_PER_CHARACTER;
    const mode = NarratorBrief.LENGTH_MODES[NarratorBrief.lengthMode(d)];
    const lines = ['[Scene notes for this reply]'];
    for (const c of present) {
      const bits = [CharacterState.line(c), (c.currentOutfitDesc || '').trim() ? 'wearing ' + c.currentOutfitDesc.trim() : '', BodyNotes.label(grounding, c)].filter(Boolean);
      lines.push('- ' + c.name + (bits.length ? ': ' + bits.join('; ') : ''));
    }
    const threads = StoryLedger.openThreads(d).slice(0, NarratorContext.ANCHOR_THREADS);
    if (threads.length) lines.push('Open questions (background, do not raise them yourself): ' + threads.join('; ') + '.');
    const pressure = StoryLedger.of(d).pressure;
    if (pressure) lines.push('Pressure (background, only if the player stalls): ' + PromptBudget.clip(pressure, NarratorContext.PRESSURE_TOKENS));
    const rules = 'Private notes, never quoted. Answer exactly what the player just did, then stop: '
      + NarratorContext.lengthRule(d, mode, move) + ' Add nothing new unless their action calls for it. '
      + 'Narration calls the player "you", never by name or description.'
      + (NarratorThinking.directive(d) ? ' ' + NarratorThinking.directive(d) : '');
    const room = Math.max(40, cap - PromptBudget.estimate(rules) - 2);
    return PromptBudget.clip(lines.join('\n'), room) + '\n' + rules;
  }

  static playerMove(messages) {
    const last = (Array.isArray(messages) ? messages : []).filter((m) => m && m.role === 'user').pop();
    return last ? PromptBudget._text(last).trim() : '';
  }

  static SMALL_MOVE_WORDS = 14;
  static MEDIUM_MOVE_WORDS = 40;
  static SMALL_SHARE = 0.4;
  static MEDIUM_SHARE = 0.7;

  static lengthRule(d, mode, move) {
    const cap = NarratorContext.wordCap(d, mode, move);
    const small = cap < mode.max && String(move || '').split(/\s+/).filter(Boolean).length <= NarratorContext.SMALL_MOVE_WORDS;
    return (small ? 'the player made a small move, so answer in two to four sentences, at most ' : 'at most ') + cap + ' words.';
  }

  static wordCap(d, mode, move) {
    const words = String(move || '').split(/\s+/).filter(Boolean).length;
    const opening = StoryLedger.of(d).turn === 0;
    if (!words || opening || words > NarratorContext.MEDIUM_MOVE_WORDS) return mode.max;
    const small = words <= NarratorContext.SMALL_MOVE_WORDS;
    return Math.round(mode.max * (small ? NarratorContext.SMALL_SHARE : NarratorContext.MEDIUM_SHARE) / 5) * 5;
  }

  static _lastTurn(c) {
    const st = CharacterState.of(c);
    const beats = CharacterChronicle.of(c).beats;
    const beatTurn = beats.length ? Number(beats[beats.length - 1].turn) || 0 : 0;
    return Math.max(st.lastSeen ? st.lastSeen.turn : 0, beatTurn);
  }
}

module.exports = NarratorContext;
