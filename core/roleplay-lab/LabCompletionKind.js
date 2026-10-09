class LabCompletionKind {
  static RULES = [
    { kind: 'stage', any: ['stage manager'] },
    { kind: 'extract', any: ['world-state'] },
    { kind: 'wardrobe', any: ['wardrobe supervisor'] },
    { kind: 'director', any: ['cinematographer'] },
    { kind: 'wardrobe', any: ['wardrobe', 'outfit'] },
    { kind: 'director', any: ['shot', 'director', 'camera'] },
    { kind: 'extract', any: ['location', 'characters'] },
  ];

  static detect(opts) {
    const text = LabCompletionKind._messageText(opts);
    const rule = LabCompletionKind.RULES.find((r) => r.any.some((needle) => text.includes(needle)));
    return rule ? rule.kind : null;
  }

  static _messageText(opts) {
    try {
      return (JSON.stringify((opts && opts.messages) || '') || '').toLowerCase();
    } catch (_) {
      return '';
    }
  }
}

module.exports = LabCompletionKind;
