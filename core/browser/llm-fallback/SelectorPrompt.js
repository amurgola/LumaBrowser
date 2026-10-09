class SelectorPrompt {
  static SYSTEM = [
    'You are a CSS selector resolver for browser automation.',
    'You will be given a natural-language description of an element and a snapshot of the interactable elements currently on the page.',
    'Return ONLY a valid CSS selector that uniquely identifies the described element: just the selector string, no explanation, no markdown, no quotes.',
    'Ground your answer strictly in the Live DOM snapshot provided below. Do not invent ids, classes, or attributes that do not appear in the snapshot.',
    'Prefer selectors in this order: id, data-testid, data-role, aria-label, name, role, then tag + attribute. Avoid brittle class-based selectors unless nothing else is available.',
    'If the snapshot is truncated and none of the listed elements match, return the closest stable selector strategy you can justify from the snapshot (e.g. a combination of tag + aria-label).',
  ].join(' ');

  static build({ description, action, failedSelector, snapshot, feedbackContext }) {
    const parts = [`Action: ${action}`, `Description: ${description}`];
    if (failedSelector) parts.push(`Original selector that failed: ${failedSelector}`);
    if (feedbackContext) {
      parts.push(`Previous attempt was rejected: ${feedbackContext}. Try a DIFFERENT targeting strategy this time.`);
    }
    const snapshotContext = SelectorPrompt.snapshotContext(snapshot);
    if (snapshotContext) parts.push(snapshotContext);
    return { system: SelectorPrompt.SYSTEM, user: parts.join('\n') };
  }

  static snapshotContext(snapshot) {
    if (!Array.isArray(snapshot) || snapshot.length === 0) return '';
    const lines = snapshot.map(SelectorPrompt._snapshotLine);
    return `\nLive DOM snapshot (interactable elements in this tab):\n${lines.join('\n')}`;
  }

  static _snapshotLine(el) {
    const attrs = SelectorPrompt._snapshotAttrs(el);
    const text = el.text ? ` "${el.text}"` : '';
    return `  ${el.selector} [${el.tag}${text}]${attrs.length ? ' ' + attrs.join(', ') : ''}`;
  }

  static _snapshotAttrs(el) {
    const attrs = [];
    if (el.id) attrs.push(`id=${el.id}`);
    if (el.dataTestId) attrs.push(`data-testid=${el.dataTestId}`);
    if (el.dataRole) attrs.push(`data-role=${el.dataRole}`);
    if (el.ariaLabel) attrs.push(`aria-label="${el.ariaLabel}"`);
    if (el.role) attrs.push(`role=${el.role}`);
    if (el.name) attrs.push(`name=${el.name}`);
    if (el.type) attrs.push(`type=${el.type}`);
    if (el.placeholder) attrs.push(`placeholder="${el.placeholder}"`);
    if (el.disabled) attrs.push('disabled');
    return attrs;
  }
}

module.exports = SelectorPrompt;
