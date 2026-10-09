class GameBriefing {
  static RECENT_NOTES = 10;

  static describe(profile) {
    return [
      ...GameBriefing._header(profile),
      ...GameBriefing._goals(profile.goals),
      GameBriefing._controls(profile.controls),
      ...GameBriefing._macros(profile.macros),
      ...GameBriefing._notes(profile.notes),
    ].join('\n');
  }

  static _header(p) {
    return [
      `GAME: ${p.title || p.gameId} (gameId ${p.gameId}), step ${p.stepCount}`,
      `ALLOWED: ${p.allowed ? 'yes' : 'no (ask the user to approve game_allow before any input)'}`,
    ];
  }

  static _goals(g) {
    return ['GOALS:', `  primary: ${g.primary || '(none)'}`, `  secondary: ${g.secondary || '(none)'}`, `  tertiary: ${g.tertiary || '(none)'}`];
  }

  static _controls(controls) {
    const entries = Object.entries(controls);
    return entries.length ? `CONTROLS: ${entries.map(([k, v]) => `${k}=${v}`).join(', ')}` : 'CONTROLS: (none learned yet)';
  }

  static _macros(macros) {
    const names = Object.keys(macros);
    return names.length ? [`MACROS: ${names.join(', ')}`] : [];
  }

  static _notes(notes) {
    const lastSummary = [...notes].reverse().find((n) => n.kind === 'summary');
    const recent = notes.filter((n) => n !== lastSummary).slice(-GameBriefing.RECENT_NOTES);
    const lines = [];
    if (lastSummary) lines.push(`LAST SUMMARY (step ${lastSummary.at}): ${lastSummary.text}`);
    if (recent.length) lines.push('NOTES:', ...recent.map(GameBriefing._noteLine));
    return lines;
  }

  static _noteLine(n) {
    return `  [${n.at}${n.kind !== 'note' ? ` ${n.kind}` : ''}] ${n.text}`;
  }
}

module.exports = GameBriefing;
