const ThinkingPreview = require('../chrome/ThinkingPreview');
const StatusLine = require('../chrome/StatusLine');
const AnsiFit = require('../ansi/AnsiFit');
const ToolGrammar = require('../ToolGrammar');
const HomePath = require('./HomePath');

class SessionView {
  static PREVIEW_ROWS = 3;
  static APPROVAL_OPTIONS = ['Allow once', 'Allow for this run', 'Deny'];

  constructor(app) {
    this.app = app;
  }

  render() {
    const app = this.app;
    if (app.closed) return;
    const width = app.screen.width;
    const full = app.fullRepaint;
    app.fullRepaint = false;
    if (full) for (const b of app.blocks) b.frozen = 0;
    const commit = this._commitDoneHead(width, full);
    const bottom = this.bottomLines(width);
    const live = this._fitLive(width, bottom.lines.length, commit);
    const cursor = bottom.cursor ? { row: live.length + bottom.cursor.row, col: bottom.cursor.col } : null;
    if (full) this._repaintAll(width, commit, live.concat(bottom.lines), cursor);
    else app.screen.paint({ commit, live: live.concat(bottom.lines), cursor });
  }

  transcriptLines(width) {
    const app = this.app;
    const out = [];
    const sp = app.spinner();
    for (const b of app.blocks) {
      const lines = b.render(width, app.theme, { spinner: sp });
      for (let i = b.frozen; i < lines.length; i++) out.push(lines[i]);
    }
    return out;
  }

  bottomLines(width) {
    const app = this.app;
    const lines = [];
    let cursor = null;
    if (app.streaming || app.turnStatus.current) this._statusLines(width, lines);
    lines.push('');
    if (app.approval) {
      this._approvalLines(width, lines);
    } else {
      const ed = app.editor.render(width);
      cursor = { row: lines.length + ed.cursor.row, col: ed.cursor.col };
      for (const l of ed.lines) lines.push(l);
    }
    lines.push(this._footer(width));
    return { lines, cursor };
  }

  _commitDoneHead(width, full) {
    const app = this.app;
    const commit = [];
    while (app.blocks.length && app.blocks[0].done) {
      const b = app.blocks.shift();
      app.committed.push(b);
      if (full) continue;
      const lines = b.render(width, app.theme, { spinner: app.spinner() });
      for (let i = b.frozen; i < lines.length; i++) commit.push(lines[i]);
    }
    return commit;
  }

  _fitLive(width, bottomHeight, commit) {
    const app = this.app;
    const live = this.transcriptLines(width);
    const room = Math.max(1, app.screen.height - bottomHeight - 1);
    if (live.length <= room) return live;
    let over = live.length - room;
    for (const b of app.blocks) {
      if (over <= 0) break;
      const take = Math.min(over, b.render(width, app.theme, { spinner: app.spinner() }).length - b.frozen);
      b.frozen += take;
      over -= take;
    }
    for (const l of live.slice(0, live.length - room)) commit.push(l);
    return live.slice(live.length - room);
  }

  _repaintAll(width, commit, live, cursor) {
    const app = this.app;
    const transcript = [];
    for (const b of app.committed) for (const l of b.render(width, app.theme, {})) transcript.push(l);
    for (const l of commit) transcript.push(l);
    app.screen.repaintAll({ transcript, live, cursor });
  }

  _statusLines(width, lines) {
    const app = this.app;
    const t = app.theme;
    const g = t.glyph;
    const secs = app.turnStartedAt ? (app.now() - app.turnStartedAt) / 1000 : null;
    const preview = app.thinkingPreview;
    lines.push('');
    if (preview) for (const l of ThinkingPreview.render({ text: preview.text, rows: SessionView.PREVIEW_ROWS }, width, t)) lines.push(l);
    const hint = this._statusHints(preview).join(t.fg('muted', ` ${g.dot} `));
    const spinner = app.stopping ? g.pending : app.spinner();
    lines.push(StatusLine.render({ spinner, text: app.turnStatus.label(app.reasoning, g.dot), secs, hint }, width, t));
  }

  _statusHints(preview) {
    const app = this.app;
    const t = app.theme;
    if (app.stopping) return [];
    const hints = [];
    if (preview) hints.push(t.hint('ctrl+o', 'expand'));
    else if (app.reasoning && !app.reasoning.done && app.reasoning.shown) hints.push(t.hint('ctrl+o', 'collapse'));
    hints.push(`${t.hint('esc', 'stop')}${app.followupsQueued ? t.fg('muted', ` ${t.glyph.dot} ${app.followupsQueued} queued`) : ''}`);
    return hints;
  }

  _approvalLines(width, lines) {
    const app = this.app;
    const t = app.theme;
    const g = t.glyph;
    const a = app.approval;
    const bar = t.fg('warn', g.bar);
    lines.push(`${bar} ${t.fg('warn', g.approval)} ${t.bold(t.fg('text', 'Approval needed'))}  ${t.fg('dim', AnsiFit.truncate(a.detail, Math.max(10, width - 24)))}`);
    const row = SessionView.APPROVAL_OPTIONS
      .map((o, i) => (i === a.idx ? t.bold(t.fg('accent', `${g.prompt} ${o}`)) : t.fg('dim', `  ${o}`)))
      .join('   ');
    lines.push(`${bar}   ${row}`);
    lines.push(`${bar}   ${t.fg('muted', `←→ choose ${g.dot} enter confirms ${g.dot} y / a / n ${g.dot} esc denies`)}`);
  }

  _footer(width) {
    const app = this.app;
    const t = app.theme;
    const g = t.glyph;
    const left = t.fg('muted', `${HomePath.tildify(app.cwd)}${app.model ? ` ${g.dot} ${app.model}` : ''}`);
    return StatusLine.joinEnds(left, this._footerRight(), width);
  }

  _footerRight() {
    const app = this.app;
    const t = app.theme;
    const g = t.glyph;
    if (app.quitArmed) return t.fg('warn', 'ctrl+c again to quit');
    if (app.lastUsage && app.lastUsage.total_tokens) {
      const total = app.lastUsage.total_tokens;
      const ctx = app.contextWindow ? ` (${Math.min(100, Math.round((total / app.contextWindow) * 100))}% of ${ToolGrammar.fmtTokens(app.contextWindow)})` : '';
      return t.fg('muted', `${ToolGrammar.fmtTokens(total)} tokens${ctx}`);
    }
    return t.fg('muted', `${app.agentName || 'Code'}${app.approvalMode === 'never' ? ` ${g.dot} approvals off` : ''}`);
  }
}

module.exports = SessionView;
