class ArtStatusNote {
  static PENDING = 'pending';
  static MISSING = ['placeholder', 'error'];

  static append(report, session) {
    const lines = ArtStatusNote.lines(session);
    if (!lines.length) return report;
    return { ...report, message: `${report.message}\n${lines.join('\n')}` };
  }

  static lines(session) {
    const assets = session && session.assets ? [...session.assets.entries()] : [];
    const pending = ArtStatusNote._paths(assets, (status) => status === ArtStatusNote.PENDING);
    const missing = ArtStatusNote._paths(assets, (status) => ArtStatusNote.MISSING.includes(status));
    const lines = [];
    if (pending.length) {
      lines.push(`ART not rendered yet (it renders after this reply), shown as framed colour boxes in this run: ${pending.join(', ')}. `
        + 'Judge layout and behaviour now, not the look, and tell the user the art is still on its way.');
    }
    if (missing.length) {
      lines.push(`ART that failed to generate and is a framed colour box: ${missing.join(', ')}. `
        + 'Tell the user which art is missing rather than describing it as finished.');
    }
    return lines;
  }

  static _paths(assets, matches) {
    return assets.filter(([, asset]) => matches((asset && asset.status) || 'done')).map(([rel]) => rel);
  }
}

module.exports = ArtStatusNote;
