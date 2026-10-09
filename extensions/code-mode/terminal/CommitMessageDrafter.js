const CommitPrompt = require('./CommitPrompt');
const GitLog = require('./GitLog');

class CommitMessageDrafter {
  static REPLY = 'commit-message-result';
  static TEMPERATURE = 0.2;
  static TIMEOUT_MS = 120000;

  constructor(session, runGit = GitLog.run) {
    this._session = session;
    this._runGit = runGit;
    this._seq = 0;
    this._handle = null;
  }

  async draft(p) {
    const requestId = p.requestId == null ? null : String(p.requestId);
    const reply = (payload) => this._session.send(CommitMessageDrafter.REPLY, { requestId, ...payload });
    const router = this._session.getRouter();
    if (!router || typeof router.completeStream !== 'function') return reply({ ok: false, message: 'the chat router is not ready yet' });
    const diff = p.diff == null ? '' : String(p.diff);
    if (!diff.trim()) return reply({ ok: false, message: 'there is nothing to describe: the diff is empty' });
    const seq = ++this._seq;
    this.stop();
    const subjects = await GitLog.recentSubjects(p.cwd ? String(p.cwd) : this._session.cwd, CommitPrompt.STYLE_SAMPLE, this._runGit);
    if (this._session.closed || seq !== this._seq) return undefined;
    this._complete(router, seq, reply, { diff, files: p.files, hint: p.hint, subjects });
    return undefined;
  }

  stop() {
    const h = this._handle;
    this._handle = null;
    if (h) {
      try { h.abort(); } catch (_) {}
    }
  }

  _complete(router, seq, reply, { diff, files, hint, subjects }) {
    const content = CommitPrompt.build({
      diff, files: Array.isArray(files) ? files : [], hint: hint == null ? '' : String(hint), subjects,
    });
    this._handle = router.completeStream(
      {
        messages: [{ role: 'user', content }],
        temperature: CommitMessageDrafter.TEMPERATURE,
        modelRef: this._session.modelRef || undefined,
        timeoutMs: CommitMessageDrafter.TIMEOUT_MS,
        noThink: true,
      },
      { onDone: (text) => this._onDone(seq, reply, text), onError: (e) => this._onError(seq, reply, e) },
    );
  }

  _onDone(seq, reply, text) {
    if (seq !== this._seq) return reply({ ok: false, message: 'superseded by a newer request' });
    this._handle = null;
    const clean = CommitPrompt.clean(text);
    return clean ? reply({ ok: true, text: clean }) : reply({ ok: false, message: 'the model returned an empty draft' });
  }

  _onError(seq, reply, e) {
    if (seq === this._seq) this._handle = null;
    reply({ ok: false, message: (e && e.message) || 'completion failed' });
  }
}

module.exports = CommitMessageDrafter;
