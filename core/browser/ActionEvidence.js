class ActionEvidence {
  static NON_TEXT_INPUTS = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'image', 'range', 'color', 'file']);
  static TEXT_ENTRY_KINDS = ['textarea', 'select', 'textbox', 'searchbox', 'combobox'];
  static MAX_REPORTED_TABS = 3;

  static NO_CHANGE_NOTE = 'Nothing visible changed (URL, focus, scroll, text, dialogs and the target all look the same). '
    + 'The action may have missed its target, or the page ignores this input.';

  static UNKNOWN_NOTE = 'The page did not answer after the action (a native alert/confirm may be open, or the page is busy). '
    + 'Check it before assuming the action worked.';

  static isFingerprint(value) {
    return !!(value && typeof value === 'object' && value.__lumaFp === 1);
  }

  static stateKey(fp) {
    if (!ActionEvidence.isFingerprint(fp)) return null;
    return ActionEvidence._hashString([fp.url, fp.textLen, fp.textHash, fp.iCount, fp.iHash, fp.dialogs, fp.sx, fp.sy].join('|'));
  }

  static compare(before, after, ctx = {}) {
    const b = ActionEvidence.isFingerprint(before) ? before : null;
    const a = ActionEvidence.isFingerprint(after) ? after : null;
    const newTabs = Array.isArray(ctx.newTabs) ? ctx.newTabs : [];
    const urlChanged = ActionEvidence._urlChanged(b, a, ctx);
    const changes = [
      ...ActionEvidence._newTabChanges(newTabs),
      ...ActionEvidence._navigationChanges(a, ctx, urlChanged),
      ...ActionEvidence._pageChanges(b, a),
    ];
    const outcome = ActionEvidence._resolveOutcome(b, a, ctx, newTabs, urlChanged, changes);
    return ActionEvidence._buildEvidence(outcome, changes, b, ctx);
  }

  static _postUrl(a, ctx) {
    return (a && a.url) || ctx.url || null;
  }

  static _urlChanged(b, a, ctx) {
    const postUrl = ActionEvidence._postUrl(a, ctx);
    return !!(b && postUrl && postUrl !== b.url);
  }

  static _newTabChanges(newTabs) {
    return newTabs.slice(0, ActionEvidence.MAX_REPORTED_TABS)
      .map((t) => `a new tab opened (tab ${t.id})${t.url ? `: ${ActionEvidence._clip(t.url, 120)}` : ''}`);
  }

  static _navigationChanges(a, ctx, urlChanged) {
    if (urlChanged) return [`url changed to ${ActionEvidence._clip(ActionEvidence._postUrl(a, ctx), 160)}`];
    if (ctx.navigated && !ctx.inPage) return ['page reloaded (same URL)'];
    return [];
  }

  static _pageChanges(b, a) {
    if (!b || !a) return [];
    return [
      ...ActionEvidence._titleChanges(b, a),
      ...ActionEvidence._dialogChanges(b, a),
      ...ActionEvidence._scrollChanges(b, a),
      ...ActionEvidence._focusChanges(b, a),
      ...ActionEvidence._targetChanges(b.target, a.target),
      ...ActionEvidence._textChanges(b, a),
      ...ActionEvidence._nodeChanges(b, a),
      ...ActionEvidence._interactiveChanges(b, a),
    ];
  }

  static _titleChanges(b, a) {
    return a.title !== b.title ? [`title changed to "${ActionEvidence._clip(a.title, 60)}"`] : [];
  }

  static _dialogChanges(b, a) {
    if (a.dialogs > b.dialogs) {
      return [`a dialog opened${a.dialogLabel ? `: "${ActionEvidence._clip(a.dialogLabel, 60)}"` : ''}`];
    }
    return a.dialogs < b.dialogs ? ['a dialog closed'] : [];
  }

  static _scrollChanges(b, a) {
    const changes = [];
    const dy = a.sy - b.sy;
    const dx = a.sx - b.sx;
    if (dy) changes.push(`page scrolled ${dy > 0 ? 'down' : 'up'} by ${Math.abs(dy)} px`);
    if (dx) changes.push(`page scrolled ${dx > 0 ? 'right' : 'left'} by ${Math.abs(dx)} px`);
    return changes;
  }

  static _focusChanges(b, a) {
    const focusKey = (fp) => (fp.active ? `${fp.active.kind}|${fp.active.label}` : '');
    const incidental = a.activeIsTarget && a.active && !ActionEvidence._isTextEntryKind(a.active.kind);
    if (focusKey(a) === focusKey(b) || incidental) return [];
    return [a.active ? `focus moved to ${ActionEvidence._describeElement(a.active)}` : 'focus left the element'];
  }

  static _targetChanges(t0, t1) {
    if (!t0) return [];
    if (!t1) return ['the target element was removed from the page'];
    const changes = [];
    if (t1.value !== t0.value && t1.value != null) changes.push(`target value is now "${ActionEvidence._clip(t1.value, 60)}"`);
    if (t1.checked !== t0.checked && t1.checked != null) changes.push(`target is now ${t1.checked ? 'checked' : 'unchecked'}`);
    if (t1.expanded !== t0.expanded && t1.expanded != null) changes.push(`target ${t1.expanded === 'true' ? 'expanded' : 'collapsed'}`);
    if (t1.selected !== t0.selected && t1.selected != null) changes.push(`target ${t1.selected === 'true' ? 'selected' : 'deselected'}`);
    if (t1.pressed !== t0.pressed && t1.pressed != null) changes.push(`target pressed state is now ${t1.pressed}`);
    if (t0.visible && !t1.visible) changes.push('the target element was hidden');
    return changes;
  }

  static _textChanges(b, a) {
    const dt = a.textLen - b.textLen;
    if (dt > 0) return [`text grew by ${dt} chars`];
    if (dt < 0) return [`text shrank by ${-dt} chars`];
    return a.textHash !== b.textHash ? ['visible text changed'] : [];
  }

  static _nodeChanges(b, a) {
    const dn = a.nodes - b.nodes;
    if (dn > 0) return [`${dn} element${dn === 1 ? '' : 's'} added`];
    if (dn < 0) return [`${-dn} element${dn === -1 ? '' : 's'} removed`];
    return [];
  }

  static _interactiveChanges(b, a) {
    if (a.iHash === b.iHash && a.iCount === b.iCount) return [];
    return [a.iCount !== b.iCount ? `interactive elements changed (${b.iCount} to ${a.iCount})` : 'interactive elements changed'];
  }

  static _resolveOutcome(b, a, ctx, newTabs, urlChanged, changes) {
    if (newTabs.length) return 'new_tab';
    if (ctx.navigated || urlChanged) return 'navigated';
    if (!a || !b) return 'unknown';
    if (a.dialogs > b.dialogs) return 'dialog';
    return changes.length ? 'changed' : 'no_change';
  }

  static _buildEvidence(outcome, changes, b, ctx) {
    const evidence = { outcome, changes };
    if (outcome === 'no_change') evidence.note = ActionEvidence.NO_CHANGE_NOTE;
    else if (outcome === 'unknown') evidence.note = ActionEvidence.UNKNOWN_NOTE;
    const key = ActionEvidence.stateKey(b);
    if (key) evidence.stateKey = key;
    ActionEvidence._attachSettle(evidence, ctx.settle);
    return evidence;
  }

  static _attachSettle(evidence, settle) {
    if (!settle) return;
    evidence.settled = !!settle.settled;
    if (Number.isFinite(settle.waitedMs)) evidence.waitedMs = settle.waitedMs;
  }

  static _isTextEntryKind(kind) {
    const k = String(kind || '');
    const input = /^input(?:\[(\w+)\])?$/.exec(k);
    if (input) return !ActionEvidence.NON_TEXT_INPUTS.has(input[1] || 'text');
    return ActionEvidence.TEXT_ENTRY_KINDS.includes(k);
  }

  static _describeElement(d) {
    if (!d) return 'the page body';
    return d.label ? `${d.kind} "${ActionEvidence._clip(d.label, 40)}"` : d.kind;
  }

  static _clip(value, max) {
    const str = String(value == null ? '' : value);
    return str.length > max ? `${str.slice(0, max - 1)}…` : str;
  }

  static _hashString(s) {
    let x = 5381;
    for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0;
    return (x >>> 0).toString(36);
  }
}

module.exports = ActionEvidence;
