const GitOptionScan = require('./GitOptionScan');
const GitPushRewrite = require('./GitPushRewrite');

class GitHistoryHazards {
  static CHECKS = Object.freeze({
    push: (rest) => GitPushRewrite.reason(rest),
    'filter-branch': () => 'git filter-branch rewrites every commit it touches; pushing the result rewrites the remote too.',
    'filter-repo': () => 'git filter-repo rewrites the whole history; pushing the result rewrites the remote too.',
    rebase: () => 'git rebase rewrites the commits on this branch.',
    reset: (rest) => GitHistoryHazards._resetReason(rest),
    branch: (rest) => GitHistoryHazards._branchReason(rest),
    tag: (rest) => GitHistoryHazards._tagReason(rest),
    'update-ref': (rest) => GitHistoryHazards._when(rest, { long: [], short: ['d'] }, 'git update-ref -d deletes a ref.'),
    checkout: (rest) => GitHistoryHazards._checkoutReason(rest),
    switch: (rest) => GitHistoryHazards._when(rest, { long: ['--discard-changes', '--force'], short: ['f'] }, 'git switch --discard-changes throws away uncommitted changes.'),
    restore: (rest) => GitHistoryHazards._restoreReason(rest),
    clean: (rest) => GitHistoryHazards._when(rest, { long: ['--force'], short: ['f'] }, 'git clean -f permanently deletes untracked files.'),
    stash: (rest) => GitHistoryHazards._verbReason(rest, ['drop', 'clear'], 'git stash drop/clear deletes stashed work.'),
    worktree: (rest) => GitHistoryHazards._worktreeReason(rest),
    reflog: (rest) => GitHistoryHazards._verbReason(rest, ['expire', 'delete', 'drop'], 'git reflog expire/delete removes the entries used to recover lost commits.'),
    gc: (rest) => GitHistoryHazards._when(rest, { long: ['--prune'], short: [] }, 'git gc --prune permanently deletes unreachable objects.'),
    prune: (rest) => (GitOptionScan.has(rest, { long: ['--dry-run'], short: ['n'] }) ? null : 'git prune permanently deletes unreachable objects.'),
    remote: (rest) => GitHistoryHazards._remoteReason(rest),
  });

  static BRANCH_VALUES = ['--sort', '--format', '--points-at', '--contains', '--no-contains', '--merged', '--no-merged', '-u', '--set-upstream-to'];
  static TAG_VALUES = ['--sort', '--format', '--points-at', '--contains', '--no-contains', '--merged', '--no-merged', '-m', '--message', '-F', '--file', '-u', '--local-user', '--cleanup'];

  static reason(subcommand, rest) {
    if (!Object.prototype.hasOwnProperty.call(GitHistoryHazards.CHECKS, subcommand)) return null;
    return GitHistoryHazards.CHECKS[subcommand](rest) || null;
  }

  static _when(rest, option, reason) {
    return GitOptionScan.has(rest, option) ? reason : null;
  }

  static _verbReason(rest, verbs, reason) {
    return verbs.includes(GitHistoryHazards._firstWord(rest)) ? reason : null;
  }

  static _resetReason(rest) {
    const mode = ['--hard', '--merge', '--keep'].find((option) => GitOptionScan.hasLong(rest, option));
    return mode ? `git reset ${mode} moves the branch and can throw away uncommitted changes.` : null;
  }

  static _branchReason(rest) {
    const values = GitHistoryHazards.BRANCH_VALUES;
    if (GitOptionScan.has(rest, { long: ['--delete'], short: ['d', 'D'], values })) return 'git branch -d/-D deletes a branch.';
    if (GitOptionScan.has(rest, { long: ['--move', '--force'], short: ['m', 'M', 'f', 'C'], values })) return 'git branch -m/-M/-f/-C rewrites or replaces a branch ref.';
    return null;
  }

  static _tagReason(rest) {
    const option = { long: ['--delete', '--force'], short: ['d', 'f'], values: GitHistoryHazards.TAG_VALUES };
    return GitHistoryHazards._when(rest, option, 'git tag -d/-f deletes or moves a tag.');
  }

  static _checkoutReason(rest) {
    if (rest.includes('--') || rest.includes('.') || GitOptionScan.has(rest, { long: ['--force'], short: ['f'] })) {
      return 'git checkout with paths or -f overwrites uncommitted changes.';
    }
    return null;
  }

  static _restoreReason(rest) {
    const staged = GitOptionScan.has(rest, { long: ['--staged'], short: ['S'] });
    const worktree = GitOptionScan.has(rest, { long: ['--worktree'], short: ['W'] });
    return !staged || worktree ? 'git restore overwrites uncommitted changes in the working tree.' : null;
  }

  static _worktreeReason(rest) {
    const verb = GitHistoryHazards._firstWord(rest);
    if (verb === 'remove' && GitOptionScan.has(rest, { long: ['--force'], short: ['f'] })) return 'git worktree remove --force deletes a worktree and its uncommitted changes.';
    if (verb === 'prune') return 'git worktree prune deletes worktree records.';
    return null;
  }

  static _remoteReason(rest) {
    const verb = GitHistoryHazards._firstWord(rest);
    return ['remove', 'rm', 'prune'].includes(verb) ? `git remote ${verb} removes remote-tracking branches.` : null;
  }

  static _firstWord(rest) {
    return rest.find((word) => !word.startsWith('-'));
  }
}

module.exports = GitHistoryHazards;
