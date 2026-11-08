class PhysicalityJudge {
  static CRITERIA = ['bodyConstraints', 'physicalPlausibility', 'differentiation', 'embodiedDetail'];
  static FAULTS = ['impossibleFeats', 'bodyAmnesia', 'stereotyping', 'clinicalVoice'];
  static TRANSCRIPT_MAX = 26000;
  static TEMPERATURE = 0.2;
  static TIMEOUT_MS = 240000;
  static SLIPS_MAX = 12;

  static messages(data, transcript) {
    const keys = PhysicalityJudge.CRITERIA.concat(PhysicalityJudge.FAULTS);
    const system = '/no_think\n'
      + 'You are a physiotherapist, an emergency nurse and a fiction editor reviewing interactive fiction for '
      + 'physical realism. Be critical and specific. Read the cast (their bodies) and the transcript, and score the '
      + 'NARRATOR\'s replies 0 (absent) to 10 (excellent) on each criterion. Faults score the same way: 10 means the '
      + 'fault is everywhere. Respond with ONLY one minified JSON object, no prose, no fences:\n'
      + '{' + keys.map((k) => '"' + k + '":number').join(',') + ',"slips":[string],"notes":string}\n'
      + 'Criteria: bodyConstraints (each character\'s age, size, condition and impairment limits and enables what '
      + 'they do, every time it matters), physicalPlausibility (strength, speed, timing, balance, cold, exertion, '
      + 'breath and fatigue behave like real bodies), differentiation (the characters move, struggle and recover '
      + 'differently because their bodies differ), embodiedDetail (concrete physical sensation and effort, not '
      + 'generic). Faults: impossibleFeats (someone does what their body could not, or too easily), bodyAmnesia (an '
      + 'established trait is ignored or contradicted later), stereotyping (a body reduced to a cliche: helpless '
      + 'elder, pitied wheelchair user, fragile pregnancy, gentle giant only), clinicalVoice (textbook or medical '
      + 'register in the narration). "slips": each concrete realism error as "turn N: what happened and why it is '
      + 'wrong", at most ' + PhysicalityJudge.SLIPS_MAX + '. "notes": two sentences on the weakest habit.';
    const cast = ((data && data.characters) || []).map((c) => '- ' + c.name + ': ' + [c.description, c.appearance].filter(Boolean).join('; ')).join('\n');
    const lines = ['Premise: ' + ((data && data.scenario) || '(none)'), 'Cast:\n' + (cast || '(none)'), 'Transcript:'];
    for (const t of transcript || []) {
      lines.push('[Player, turn ' + t.turn + '] ' + t.user);
      lines.push('[Narrator] ' + t.assistant);
    }
    return [{ role: 'system', content: system }, { role: 'user', content: lines.join('\n\n').slice(0, PhysicalityJudge.TRANSCRIPT_MAX) + '\n\nJSON:' }];
  }

  static request(data, transcript) {
    return {
      messages: PhysicalityJudge.messages(data, transcript), temperature: PhysicalityJudge.TEMPERATURE,
      timeoutMs: PhysicalityJudge.TIMEOUT_MS, noThink: true, modelRef: (data && data.llmModel) || undefined,
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
    for (const k of PhysicalityJudge.CRITERIA.concat(PhysicalityJudge.FAULTS)) {
      const v = Number(obj[k]);
      if (Number.isFinite(v)) { scores[k] = Math.max(0, Math.min(10, Math.round(v * 10) / 10)); any = true; }
    }
    if (!any) return null;
    const slips = Array.isArray(obj.slips) ? obj.slips.map((x) => String(x || '').trim()).filter(Boolean).slice(0, PhysicalityJudge.SLIPS_MAX) : [];
    return { scores, slips, notes: String(obj.notes || '').trim() };
  }
}

module.exports = PhysicalityJudge;
