class BatchSpecs {
  static MAX_BODY_CHARS = 24000;

  static validate(specs) {
    if (!Array.isArray(specs) || specs.length === 0) return 'Provide a non-empty "tasks" array.';
    for (const s of specs) {
      const error = BatchSpecs._specError(s);
      if (error) return error;
    }
    return null;
  }

  static toSchedulerTasks(specs) {
    return specs.map((s, i) => ({
      id: `t${i + 1}`,
      kind: s.kind === 'edit' ? 'edit' : 'explore',
      files: Array.isArray(s.files) ? s.files : [],
      instruction: String(s.instruction),
    }));
  }

  static summarize(tasks, results) {
    const lines = results.map((r, i) => BatchSpecs._line(tasks[i], r));
    return `Ran ${results.length} sub-task(s) in parallel (review and continue):\n${lines.join('\n')}`;
  }

  static clip(text) {
    const max = BatchSpecs.MAX_BODY_CHARS;
    if (text.length <= max) return text;
    return `${text.slice(0, max)}\n  …[report truncated at ${max} of ${text.length} chars. `
      + 'Re-run this sub-task with a narrower scope if you need the rest.]';
  }

  static _specError(s) {
    if (!s || typeof s.instruction !== 'string' || !s.instruction.trim()) return 'Each task needs a non-empty "instruction".';
    if (s.kind && s.kind !== 'explore' && s.kind !== 'edit') return `Unknown task kind "${s.kind}": use "explore" (read-only) or "edit".`;
    if (s.kind === 'edit' && (!Array.isArray(s.files) || s.files.length === 0)) {
      return 'An "edit" task must list its target "files" so colliding edits are serialized.';
    }
    return null;
  }

  static _line(t, r) {
    if (!r || r.status === 'error') return `- [${t.id} ${t.kind}] FAILED: ${(r && r.error) || 'unknown error'}`;
    const v = r.value || {};
    const status = v.error ? `error: ${v.error}` : 'done';
    const changed = Array.isArray(v.changedFiles) && v.changedFiles.length ? `\n  changed: ${v.changedFiles.join(', ')}` : '';
    const body = BatchSpecs.clip((v.text || '').trim());
    return `- [${t.id} ${t.kind}] ${status}${changed}${body ? `\n  ${body.replace(/\n/g, '\n  ')}` : ''}`;
  }
}

module.exports = BatchSpecs;
