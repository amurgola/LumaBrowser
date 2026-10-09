class CommitPrompt {
  static STYLE_SAMPLE = 12;
  static MAX_DIFF_CHARS = 96 * 1024;
  static MAX_FILES = 200;
  static RULES = [
    'Write the commit message for the changes below, the way a careful engineer on this project would.',
    '',
    'Rules:',
    '- Line 1 is the subject: what changed and why, imperative mood ("Add", "Fix", "Remove"), at most 72 characters, no trailing period.',
    '- When the change has several distinct parts, leave one blank line and add a short body: one "- " bullet per part, each a single line. Skip the body when the subject already says it all.',
    '- Describe the behaviour or intent, not the file list, and do not restate the diff line by line.',
    '- Never mention "this commit", "the diff", or these instructions.',
    '- Reply with the commit message text only: no code fences, no quotes, no heading, no explanation.',
  ];

  static build({ diff, files, hint, subjects }) {
    const lines = [...CommitPrompt.RULES];
    CommitPrompt._addSubjects(lines, subjects);
    CommitPrompt._addHint(lines, hint);
    CommitPrompt._addFiles(lines, files);
    lines.push('', 'Diff:', '```diff', CommitPrompt._cappedDiff(diff), '```');
    return lines.join('\n');
  }

  static clean(text) {
    let t = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const fence = /^```[a-z]*\s*\n([\s\S]*?)\n?```\s*$/i.exec(t);
    if (fence) t = fence[1].trim();
    t = t.replace(/^\s*(?:commit message|subject|message)\s*:\s*\n?/i, '').trim();
    if (/^(["'`]).*\1$/s.test(t) && !t.slice(1, -1).includes(t[0])) t = t.slice(1, -1).trim();
    return t.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  static _cappedDiff(diff) {
    const body = String(diff || '');
    if (body.length <= CommitPrompt.MAX_DIFF_CHARS) return body;
    const dropped = body.length - CommitPrompt.MAX_DIFF_CHARS;
    return `${body.slice(0, CommitPrompt.MAX_DIFF_CHARS)}\n… (diff truncated here; ${dropped} more characters not shown)`;
  }

  static _addSubjects(lines, subjects) {
    const sample = Array.isArray(subjects) ? subjects.map((s) => String(s || '').trim()).filter(Boolean) : [];
    if (!sample.length) return;
    lines.push('', 'Recent commit subjects in this repository. Keep their conventions (prefixes, tense, capitalization):');
    for (const s of sample) lines.push(`- ${s.slice(0, 160)}`);
  }

  static _addHint(lines, hint) {
    const note = String(hint || '').trim();
    if (note) lines.push('', `The developer's own note about this change (fold it in, do not just echo it): ${note.slice(0, 600)}`);
  }

  static _addFiles(lines, files) {
    const rows = (Array.isArray(files) ? files : [])
      .filter((f) => f && f.path)
      .slice(0, CommitPrompt.MAX_FILES)
      .map((f) => `- ${f.status ? `${String(f.status).trim()} ` : ''}${String(f.path).trim()}`);
    if (rows.length) lines.push('', 'Files:', ...rows);
  }
}

module.exports = CommitPrompt;
