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
    const lines = ['# Roleplay Lab text run', ''];
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
    lines.push('', '## Consistency checks', '');
    for (const c of (r.probe && r.probe.checks) || []) lines.push('- ' + (c.ok ? '[x]' : '[ ]') + ' ' + c.label + (c.detail ? ' (' + c.detail + ')' : ''));
    lines.push('', '## Transcript', '');
    (r.transcript || []).forEach((t, i) => {
      const reply = r.prose && r.prose.replies ? r.prose.replies[i] : null;
      lines.push('### Turn ' + t.turn, '', '**Player:** ' + t.user, '', t.assistant, '');
      if (reply) lines.push('_' + reply.words + ' words' + (reply.hits.length ? '; slop: ' + reply.hits.join(', ') : '') + (t.contextTokens ? '; context ~' + t.contextTokens + ' tokens' : '') + '_', '');
    });
    return lines.join('\n');
  }
}

module.exports = LabTextReport;
