const NarratorContext = require('../prompts/NarratorContext');
const SpeakerNames = require('../prompts/SpeakerNames');

class ConsistencyProbe {
  static run({ data, transcript, facts }) {
    const checks = [];
    const context = NarratorContext.build(data || {}).systemPrompt;
    for (const f of facts || []) {
      checks.push(ConsistencyProbe._retained(f, context));
      if (f.askTurn) checks.push(ConsistencyProbe._recalled(f, transcript));
      if (f.deathTurn && f.character) checks.push(ConsistencyProbe._staysDead(f, transcript));
    }
    checks.push(ConsistencyProbe._playerNotSpokenFor(data, transcript));
    checks.push(ConsistencyProbe._turnCount(data, transcript));
    const passed = checks.filter((c) => c.ok).length;
    return { checks, passed, total: checks.length, score: checks.length ? Math.round((passed / checks.length) * 100) / 100 : 0 };
  }

  static _retained(f, context) {
    const lower = String(context || '').toLowerCase();
    const hit = f.keywords.find((k) => lower.includes(String(k).toLowerCase()));
    return { id: f.id + ':retained', label: 'Still in context: ' + f.label, ok: !!hit, detail: hit ? 'found "' + hit + '"' : 'none of ' + f.keywords.join(', ') };
  }

  static _recalled(f, transcript) {
    const t = (transcript || []).find((x) => x.turn === f.askTurn);
    const text = t ? String(t.assistant || '').toLowerCase() : '';
    const hit = f.keywords.find((k) => text.includes(String(k).toLowerCase()));
    return { id: f.id + ':recalled', label: 'Recalled when asked (turn ' + f.askTurn + '): ' + f.label, ok: !!hit, detail: t ? (hit ? 'found "' + hit + '"' : 'reply did not mention it') : 'no reply for that turn' };
  }

  static _staysDead(f, transcript) {
    const after = (transcript || []).filter((x) => x.turn > f.deathTurn);
    const spoke = after.find((x) => SpeakerNames.parse(x.assistant).some((n) => n.toLowerCase() === String(f.character).toLowerCase()));
    return { id: f.id + ':dead', label: f.character + ' never speaks after turn ' + f.deathTurn, ok: !spoke, detail: spoke ? 'spoke on turn ' + spoke.turn : 'silent' };
  }

  static _playerNotSpokenFor(data, transcript) {
    const name = data && data.protagonist && data.protagonist.name ? String(data.protagonist.name).toLowerCase() : '';
    const spoke = name ? (transcript || []).find((x) => SpeakerNames.parse(x.assistant).some((n) => n.toLowerCase() === name)) : null;
    return { id: 'player:agency', label: 'The player is never given a speaker line', ok: !spoke, detail: spoke ? 'turn ' + spoke.turn : (name ? 'ok' : 'no player name set') };
  }

  static _turnCount(data, transcript) {
    const turn = data && data.story ? Number(data.story.turn) || 0 : 0;
    const n = (transcript || []).length;
    return { id: 'story:turns', label: 'The story counted every turn', ok: turn === n, detail: turn + ' of ' + n };
  }
}

module.exports = ConsistencyProbe;
