class ReplayTimeline {
  static TOKENS_PER_SEC = 70;
  static CHARS_PER_TOKEN = 4.2;

  constructor() {
    this._entries = [];
  }

  static msFor(text) {
    return Math.round((String(text).length / ReplayTimeline.CHARS_PER_TOKEN / ReplayTimeline.TOKENS_PER_SEC) * 1000);
  }

  add(wait, type, payload) {
    this._entries.push([wait, type, payload || {}]);
    return this;
  }

  stream(type, text) {
    for (const piece of text.match(/\S+\s*|\s+/g) || []) this.add(ReplayTimeline.msFor(piece), type, { text: piece });
    return this;
  }

  tool(name, params, target, summary, took) {
    const chars = JSON.stringify(params).length;
    this.add(260, 'tool', { phase: 'pending', tool: name, target });
    this.add(Math.min(900, ReplayTimeline.msFor(JSON.stringify(params)) + 120), 'tool', { phase: 'pending', tool: name, target, chars });
    this.add(120, 'tool', { phase: 'run', tool: name, params });
    this.add(took, 'tool', { phase: 'done', tool: name, success: true, summary });
    return this;
  }

  command(cmd, lines, summary, success) {
    this.add(300, 'tool', { phase: 'pending', tool: 'run_command', target: cmd });
    this.add(380, 'tool', { phase: 'run', tool: 'run_command', params: { command: cmd } });
    this.add(500, 'command:output', { command: cmd, chunk: `${lines[0]}\n` });
    for (const line of lines.slice(1)) this.add(line ? 110 : 60, 'command:output', { command: cmd, chunk: `${line}\n` });
    this.add(260, 'tool', { phase: 'done', tool: 'run_command', success, summary });
    return this;
  }

  entries() {
    return this._entries.slice();
  }
}

module.exports = ReplayTimeline;
