class ProseJudge {
  static CRITERIA = ['believableActions', 'consistentVoice', 'elegantProse', 'emotionallyEngaging', 'coherent'];
  static FAULTS = ['tellDontShow', 'purpleProse', 'meandering', 'weakDialogue'];
  static TRANSCRIPT_MAX = 14000;
  static TEMPERATURE = 0.2;
  static TIMEOUT_MS = 180000;

  static messages(data, transcript) {
    const system = '/no_think\n'
      + 'You are a critic of interactive fiction, and your job is to be critical, especially of amateurish '
      + 'elements. Read the transcript (the player\'s turns and the narrator\'s replies) and score the NARRATOR\'s '
      + 'replies on each criterion from 0 (absent) to 10 (excellent). Faults are scored the same way: 10 means the '
      + 'fault is everywhere. Respond with ONLY one minified JSON object, no prose, no fences:\n'
      + '{' + ProseJudge.CRITERIA.concat(ProseJudge.FAULTS).map((k) => '"' + k + '":number').join(',') + ',"notes":string}\n'
      + 'Criteria: believableActions (characters act from who they are), consistentVoice (each character sounds like '
      + 'themselves every time), elegantProse (concrete, varied rhythm, no flowery verbosity), emotionallyEngaging, '
      + 'coherent (facts and continuity hold). Faults: tellDontShow (named emotions, narrated perception), '
      + 'purpleProse (overwrought, stock metaphors), meandering, weakDialogue (on the nose, explained lines). '
      + '"notes": two sentences on the worst habit you saw.';
    const cast = ((data && data.characters) || []).map((c) => c.name + (c.description ? ' (' + c.description + ')' : '')).join('; ');
    const lines = ['Premise: ' + ((data && data.scenario) || '(none)'), 'Cast: ' + (cast || '(none)'), 'Transcript:'];
    for (const t of transcript || []) {
      lines.push('[Player, turn ' + t.turn + '] ' + t.user);
      lines.push('[Narrator] ' + t.assistant);
    }
    return [{ role: 'system', content: system }, { role: 'user', content: lines.join('\n\n').slice(0, ProseJudge.TRANSCRIPT_MAX) + '\n\nJSON:' }];
  }

  static request(data, transcript) {
    return {
      messages: ProseJudge.messages(data, transcript), temperature: ProseJudge.TEMPERATURE,
      timeoutMs: ProseJudge.TIMEOUT_MS, noThink: true, modelRef: (data && data.llmModel) || undefined,
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
    for (const k of ProseJudge.CRITERIA.concat(ProseJudge.FAULTS)) {
      const v = Number(obj[k]);
      if (Number.isFinite(v)) { scores[k] = Math.max(0, Math.min(10, Math.round(v * 10) / 10)); any = true; }
    }
    return any ? { scores, notes: String(obj.notes || '').trim() } : null;
  }
}

module.exports = ProseJudge;
