'use strict';

const fs = require('fs');
const path = require('path');

class GitChangeSet {
  static MAX_TOTAL_CHARS = 96000;
  static MAX_UNTRACKED_BYTES = 200000;
  static UNTRACKED = 7;

  static STATUS_WORD = Object.freeze({
    0: 'modified', 1: 'added', 2: 'deleted', 3: 'moved', 4: 'added',
    5: 'modified', 6: 'deleted', 7: 'added', 9: 'added', 10: 'moved',
  });

  static pickRepository(api, arg, root, platform = process.platform) {
    const repos = api.repositories || [];
    if (!repos.length) return null;
    const norm = (p) => (platform === 'win32' ? String(p).toLowerCase() : String(p));
    const argRoot = arg && arg.rootUri && arg.rootUri.fsPath;
    if (argRoot) { const hit = repos.find((r) => norm(r.rootUri.fsPath) === norm(argRoot)); if (hit) return hit; }
    if (root) { const hit = repos.find((r) => norm(root).startsWith(norm(r.rootUri.fsPath))); if (hit) return hit; }
    return repos[0];
  }

  static describe(change, repoRoot) {
    const rel = (u) => path.relative(repoRoot, u.fsPath).split(path.sep).join('/');
    const status = GitChangeSet.STATUS_WORD[change.status] || 'modified';
    const to = rel(change.renameUri || change.uri);
    const from = change.originalUri ? rel(change.originalUri) : to;
    return { path: status === 'moved' && from !== to ? `${from} -> ${to}` : to, status };
  }

  static untrackedDiff(change, repoRoot) {
    try {
      const st = fs.statSync(change.uri.fsPath);
      if (!st.isFile() || st.size > GitChangeSet.MAX_UNTRACKED_BYTES) return '';
      const buf = fs.readFileSync(change.uri.fsPath);
      if (buf.includes(0)) return '';
      const rel = path.relative(repoRoot, change.uri.fsPath).split(path.sep).join('/');
      const lines = buf.toString('utf8').split(/\r?\n/);
      if (lines.length && lines[lines.length - 1] === '') lines.pop();
      return `diff --git a/${rel} b/${rel}\nnew file mode 100644\n--- /dev/null\n+++ b/${rel}\n@@ -0,0 +1,${lines.length} @@\n${lines.map((l) => `+${l}`).join('\n')}\n`;
    } catch (_) { return ''; }
  }

  static async collect(repo) {
    const repoRoot = repo.rootUri.fsPath;
    const staged = repo.state.indexChanges || [];
    if (staged.length) return { diff: await repo.diff(true), files: staged.map((c) => GitChangeSet.describe(c, repoRoot)), scope: 'staged' };
    const working = [...(repo.state.workingTreeChanges || []), ...(repo.state.untrackedChanges || [])];
    if (!working.length) return { diff: '', files: [], scope: 'none' };
    const diff = GitChangeSet._withUntracked(await repo.diff(false), working, repoRoot);
    return { diff, files: working.map((c) => GitChangeSet.describe(c, repoRoot)), scope: 'working tree' };
  }

  static _withUntracked(diff, working, repoRoot) {
    let out = diff;
    for (const c of working) {
      if (c.status !== GitChangeSet.UNTRACKED) continue;
      if (out.length >= GitChangeSet.MAX_TOTAL_CHARS) break;
      out += (out && !out.endsWith('\n') ? '\n' : '') + GitChangeSet.untrackedDiff(c, repoRoot);
    }
    return out;
  }
}

module.exports = GitChangeSet;
