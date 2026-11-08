const fs = require('fs');
const path = require('path');

class LabTextReport {
  static JSON_FILE = 'text-run.json';
  static MD_FILE = 'text-run.md';

  static write(outDir, result) {
    try {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, LabTextReport.JSON_FILE), JSON.stringify(result, null, 2));
      fs.writeFileSync(path.join(outDir, LabTextReport.MD_FILE), LabTextReport.markdown(result));
      return outDir;
    } catch (_) {
      return null;
    }
  }

  static markdown(result) {
    const r = result || {};
    const lines = ['# Roleplay Lab text run' + (r.scenario ? ' (' + r.scenario + ')' : ''), ''];
    if (r.error) lines.push('**Error:** ' + r.error, '');
    lines.push('## Scores', '');
    if (r.probe) lines.push('- Consistency: ' + r.probe.passed + ' of ' + r.probe.total + ' checks (' + r.probe.score + ')');
    if (r.prose) {
      lines.push('- Slop per hundred words: ' + r.prose.perHundred);
      lines.push('- Replies in the length band ' + r.prose.band.join(' to ') + ': ' + r.prose.inBand);
      lines.push('- Replies with a speaker tag: ' + r.prose.tagged + '; ending on a handoff: ' + r.prose.handoff);
      lines.push('- Words per reply: min ' + r.prose.words.min + ', avg ' + r.prose.words.avg + ', max ' + r.prose.words.max);
    }
    if (r.judge && r.judge.scores) {
      lines.push('- Judge: ' + Object.entries(r.judge.scores).map(([k, v]) => k + ' ' + v).join(', '));
      if (r.judge.notes) lines.push('  - ' + r.judge.notes);
    }
    if (r.physicality && r.physicality.scores) {
      lines.push('- Physicality: ' + Object.entries(r.physicality.scores).map(([k, v]) => k + ' ' + v).join(', '));
      if (r.physicality.notes) lines.push('  - ' + r.physicality.notes);
      for (const slip of r.physicality.slips || []) lines.push('  - slip: ' + slip);
    }
    if (r.context) {
      const c = r.context;
      const layers = Object.entries(c.layers).map(([k, v]) => k + ' ' + v).join(', ');
      lines.push('- Context per narrator turn (avg tokens): total ' + c.total + ' (peak ' + c.peak + '); system ' + c.system + ' [' + layers + ']; history ' + c.history
        + '; scene notes ' + c.anchor + '; reasoning in history ' + c.think + '; repeated six-word phrases ' + c.duplicateWords);
    }
    if (r.bodyDetail) lines.push('- Body detail: ' + r.bodyDetail.perHundred + ' body words per hundred (' + r.bodyDetail.hits + ' in ' + r.bodyDetail.words + ')');
    if (r.grounding) {
      const cards = Object.entries(r.grounding.cards || {}).map(([k, v]) => k + ' x' + v).join(', ');
      lines.push('- Grounding: cards on ' + r.grounding.turnsWithCards + ' turns' + (cards ? ' (' + cards + ')' : '')
        + (r.grounding.expectNone ? (r.grounding.ok ? '; none expected, none fired' : '; NONE EXPECTED, BUT CARDS FIRED') : ''));
    }
    if (r.reveal && r.reveal.scores) {
      lines.push('- Reveal: ' + Object.entries(r.reveal.scores).map(([k, v]) => k + ' ' + v).join(', '));
      if (r.reveal.notes) lines.push('  - ' + r.reveal.notes);
      for (const x of r.reveal.retention || []) lines.push('  - turn ' + x.turn + ' sees ' + x.kept + ' of ' + x.total + ' earlier reveals (' + x.inHistory + ' still in the raw history, ' + x.memoryOnly + ' only in stored memory)');
      const recalls = r.reveal.recalls || [];
      if (recalls.length) lines.push('  - recalls matching: ' + recalls.filter((x) => x.matches).length + ' of ' + recalls.length);
    }
    if (r.reveal && (r.reveal.reveals || []).length) {
      lines.push('', '## Reveals', '');
      const last = (r.reveal.retention || [])[(r.reveal.retention || []).length - 1];
      const kept = new Map(((last && last.items) || []).map((i) => [i.turn + '|' + i.detail, i.retained]));
      for (const x of r.reveal.reveals) {
        const k = kept.get(x.turn + '|' + x.detail);
        lines.push('- turn ' + x.turn + ', ' + x.who + ': ' + x.detail + (k === undefined ? '' : (k ? ' (still seen at the end)' : ' (gone at the end)')));
      }
      for (const x of r.reveal.recalls || []) lines.push('- recall turn ' + x.turn + ', ' + x.who + ': ' + (x.matches ? 'matches' : 'DRIFTS') + (x.note ? ' (' + x.note + ')' : ''));
    }
    lines.push('', '## Consistency checks', '');
    for (const c of (r.probe && r.probe.checks) || []) lines.push('- ' + (c.ok ? '[x]' : '[ ]') + ' ' + c.label + (c.detail ? ' (' + c.detail + ')' : ''));
    if (r.cast) {
      lines.push('', '## Cast and initiative', '');
      for (const c of r.cast.checks || []) lines.push('- ' + (c.ok ? '[x]' : '[ ]') + ' ' + c.label + (c.detail ? ' (' + c.detail + ')' : ''));
      for (const p of (r.cast.voice && r.cast.voice.pairs) || []) lines.push('- ' + p.a + ' / ' + p.b + ': voice overlap ' + p.voice + ', dialogue overlap ' + p.dialogue);
      if (r.cast.initiative) {
        const i = r.cast.initiative;
        lines.push('- Moved on turns: ' + (i.movedTurns.join(', ') || 'none') + '; unprompted: ' + (i.unpromptedTurns.join(', ') || 'none') + '; longest gap: ' + i.longestGap);
      }
    }
    lines.push('', '## Transcript', '');
    (r.transcript || []).forEach((t, i) => {
      const reply = r.prose && r.prose.replies ? r.prose.replies[i] : null;
      lines.push('### Turn ' + t.turn, '', '**Player:** ' + t.user, '', t.assistant, '');
      if (t.audit) {
        const a = t.audit;
        const dupes = (a.duplicates || []).slice(0, 3).map((d) => d.a + '/' + d.b + ' ' + d.words).join(', ');
        lines.push('_context: ' + a.total + ' tokens: system ' + a.system + ' [' + Object.entries(a.layers).map(([k, v]) => k + ' ' + v).join(', ') + '], history ' + a.history
          + ' (' + a.historyMessages + ' msgs' + (a.think ? ', ' + a.think + ' reasoning' : '') + '), notes ' + a.anchor + (dupes ? '; repeats: ' + dupes : '') + '_', '');
      }
      if (t.grounding) {
        const parts = ['body', 'surface'].flatMap((layer) => Object.entries(t.grounding[layer] || {}).map(([who, ids]) => layer + ' ' + who + ': ' + ids.join(', ')));
        if (parts.length) lines.push('_grounding: ' + parts.join('; ') + '_', '');
      }
      if (reply) lines.push('_' + reply.words + ' words' + (reply.hits.length ? '; slop: ' + reply.hits.join(', ') : '') + (t.contextTokens ? '; context ~' + t.contextTokens + ' tokens' : '') + '_', '');
    });
    return lines.join('\n');
  }
}

module.exports = LabTextReport;
