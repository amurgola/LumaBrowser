const { execFileSync } = require('child_process');

class GitQuery {
  static run(root, args) {
    try {
      return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (_) {
      return null;
    }
  }

  static lines(root, args) {
    const out = GitQuery.run(root, args);
    if (!out) return [];
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  }
}

module.exports = GitQuery;
