class TriggerMemoryBlock {
  static DEFAULT_RUNS_WANTED = 5;
  static DEFAULT_MAX_CHARS = 4000;
  static INPUT_PREVIEW_CHARS = 160;
  static OUTPUT_PREVIEW_CHARS = 240;

  static INSTRUCTIONS = [
    'Use this to avoid repeating yourself, to follow up on threads, and to honour what you promised.',
    'Before your final report, call save_memory with the COMPLETE updated notes (facts worth keeping:',
    'who asked what, what you answered or did, open items, preferences). Rewrite, do not append blindly;',
    'drop what is stale. Skip the call only when nothing worth remembering happened.',
  ];

  static build(notes, runs, { runsWanted = TriggerMemoryBlock.DEFAULT_RUNS_WANTED, maxChars = TriggerMemoryBlock.DEFAULT_MAX_CHARS } = {}) {
    return [
      '<trigger_memory>',
      `This trigger keeps memory across runs. Notes saved by earlier runs (yours to keep current, up to ${maxChars} characters):`,
      notes && String(notes).trim() ? String(notes).trim() : '(no notes yet)',
      ...TriggerMemoryBlock._runDigest(runs, runsWanted),
      ...TriggerMemoryBlock.INSTRUCTIONS,
      '</trigger_memory>',
    ].join('\n');
  }

  static _runDigest(runs, runsWanted) {
    if (!(runsWanted > 0)) return [];
    const list = Array.isArray(runs) ? runs.slice(0, runsWanted) : [];
    if (!list.length) return ['No earlier runs.'];
    return [`Last ${list.length} run${list.length === 1 ? '' : 's'}, newest first:`, ...list.map(TriggerMemoryBlock._runLine)];
  }

  static _runLine(run) {
    const when = String(run.startedAt || '').slice(0, 16).replace('T', ' ');
    const input = TriggerMemoryBlock._oneLine(TriggerMemoryBlock._inputSummary(run.event || {})).slice(0, TriggerMemoryBlock.INPUT_PREVIEW_CHARS);
    const output = TriggerMemoryBlock._oneLine(run.response || run.error || '').trim().slice(0, TriggerMemoryBlock.OUTPUT_PREVIEW_CHARS);
    return `- ${when} (${run.kind || 'event'}, ${run.status || '?'}) in: ${input} | out: ${output}`;
  }

  static _inputSummary(ev) {
    if (ev.event === 'notification' || ev.title) {
      return [ev.title, TriggerMemoryBlock._text(ev.body)].filter(Boolean).join(' / ');
    }
    return ev.name || ev.path || (ev.body != null ? TriggerMemoryBlock._text(ev.body) : (ev.url || ''));
  }

  static _text(value) {
    if (typeof value === 'string') return value;
    return value == null ? '' : JSON.stringify(value);
  }

  static _oneLine(value) {
    return String(value || '').replace(/\s+/g, ' ');
  }
}

module.exports = TriggerMemoryBlock;
