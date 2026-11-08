class RevealJudge {
  static CRITERIA = ['specificity', 'bodyFit', 'sensoryRange', 'continuity'];
  static FAULTS = ['contradiction', 'genericDetail', 'clinicalVoice', 'lingering'];
  static TRANSCRIPT_MAX = 30000;
  static TEMPERATURE = 0.2;
  static TIMEOUT_MS = 240000;
  static LIST_MAX = 24;

  static messages(data, transcript, { revealTurns = [], recallTurns = [] } = {}) {
    const keys = RevealJudge.CRITERIA.concat(RevealJudge.FAULTS);
    const system = '/no_think\n'
      + 'You are an emergency nurse, a podiatrist and a fiction editor. Read the cast (their bodies) and the '
      + 'transcript. On the reveal turns' + (revealTurns.length ? ' (' + revealTurns.join(', ') + ')' : '') + ' the '
      + 'player looks at feet, legs, ankles or hands for the first time; on the recall turns'
      + (recallTurns.length ? ' (' + recallTurns.join(', ') + ')' : '') + ' the same body parts come up again. '
      + 'Respond with ONLY one minified JSON object, no prose, no fences:\n'
      + '{' + keys.map((k) => '"' + k + '":number').join(',')
      + ',"reveals":[{"turn":number,"who":string,"detail":string,"keywords":[string]}]'
      + ',"recalls":[{"turn":number,"who":string,"matches":boolean,"note":string}],"notes":string}\n'
      + '"reveals": every distinct new physical detail the NARRATOR stated on a reveal turn (shape, skin, colour, '
      + 'texture, temperature, marks, nails, swelling, smell), one entry per detail, "keywords" = two or three '
      + 'distinctive single words from the narrator\'s own wording. "recalls": each recall-turn mention of a '
      + 'body part revealed earlier, "matches" = whether it agrees with the earlier detail (a plausible overnight '
      + 'change counts as agreeing). At most ' + RevealJudge.LIST_MAX + ' of each. Score 0 to 10: specificity '
      + '(concrete, particular details rather than "tired feet"), bodyFit (details fit that character\'s age, '
      + 'size, work, condition and a night in wet footwear and cold water), sensoryRange (sight, touch, '
      + 'temperature, smell, sound used where natural), continuity (recalls agree with reveals). Faults, 10 = '
      + 'everywhere: contradiction (a recall contradicts a reveal), genericDetail (details that could belong to '
      + 'anyone), clinicalVoice (textbook or medical register in the narration), lingering (dwelling on a body '
      + 'part longer or more lavishly than the moment needs). "notes": two sentences.';
    const cast = ((data && data.characters) || []).map((c) => '- ' + c.name + ': ' + [c.description, c.appearance].filter(Boolean).join('; ')).join('\n');
    const lines = ['Cast:\n' + (cast || '(none)'), 'Transcript:'];
    for (const t of transcript || []) {
      lines.push('[Player, turn ' + t.turn + '] ' + t.user);
      lines.push('[Narrator, turn ' + t.turn + '] ' + t.assistant);
    }
    return [{ role: 'system', content: system }, { role: 'user', content: lines.join('\n\n').slice(0, RevealJudge.TRANSCRIPT_MAX) + '\n\nJSON:' }];
  }

  static request(data, transcript, opts) {
    return {
      messages: RevealJudge.messages(data, transcript, opts), temperature: RevealJudge.TEMPERATURE,
      timeoutMs: RevealJudge.TIMEOUT_MS, noThink: true, modelRef: (data && data.llmModel) || undefined,
    };
  }

  static parse(text) {
    if (!text || typeof text !== 'string') return null;
    const s = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    let obj;
    try { obj = JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; }
    if (!obj || typeof obj !== 'object') return null;
    const scores = {};
    let any = false;
    for (const k of RevealJudge.CRITERIA.concat(RevealJudge.FAULTS)) {
      const v = Number(obj[k]);
      if (Number.isFinite(v)) { scores[k] = Math.max(0, Math.min(10, Math.round(v * 10) / 10)); any = true; }
    }
    if (!any) return null;
    const list = (x) => (Array.isArray(x) ? x.filter((e) => e && typeof e === 'object').slice(0, RevealJudge.LIST_MAX) : []);
    const reveals = list(obj.reveals).map((r) => ({
      turn: Number(r.turn) || 0, who: String(r.who || ''), detail: String(r.detail || '').trim(),
      keywords: (Array.isArray(r.keywords) ? r.keywords : []).map((k) => String(k || '').trim().toLowerCase()).filter(Boolean).slice(0, 4),
    })).filter((r) => r.detail);
    const recalls = list(obj.recalls).map((r) => ({ turn: Number(r.turn) || 0, who: String(r.who || ''), matches: r.matches === true, note: String(r.note || '').trim() }));
    return { scores, reveals, recalls, notes: String(obj.notes || '').trim() };
  }

  static retention(reveals, { memory = '', inHistory = new Set() } = {}) {
    const ctx = String(memory || '').toLowerCase();
    const items = (reveals || []).map((r) => {
      const hit = r.keywords.find((k) => k.length > 2 && ctx.includes(k));
      const history = inHistory.has(r.turn);
      return { turn: r.turn, who: r.who, detail: r.detail, inHistory: history, inMemory: !!hit, keyword: hit || '', retained: history || !!hit };
    });
    const count = (f) => items.filter(f).length;
    return {
      items, total: items.length, kept: count((i) => i.retained),
      inHistory: count((i) => i.inHistory), inMemory: count((i) => i.inMemory), memoryOnly: count((i) => i.inMemory && !i.inHistory),
    };
  }
}

module.exports = RevealJudge;
