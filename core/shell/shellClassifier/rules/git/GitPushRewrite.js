const GitOptionScan = require('./GitOptionScan');

class GitPushRewrite {
  static KINDS = Object.freeze([
    { option: { long: ['--mirror'], short: [] }, reason: 'git push --mirror makes the remote match this repository exactly, deleting any branch or tag it lacks.' },
    { option: { long: ['--force'], short: ['f'] }, reason: 'git push --force overwrites the remote branch; commits only the remote has are lost.' },
    { option: { long: ['--force-with-lease'], short: [] }, reason: 'git push --force-with-lease rewrites history on the remote (it only checks nobody pushed meanwhile).' },
    { option: { long: ['--delete'], short: ['d'] }, reason: 'git push --delete removes a branch or tag from the remote.' },
    { option: { long: ['--prune'], short: [] }, reason: 'git push --prune deletes remote branches that have no local counterpart.' },
  ]);

  static VALUE_OPTIONS = ['--repo', '--push-option', '-o', '--receive-pack', '--exec'];

  static DELETE_REFSPEC_REASON = 'git push origin :<branch> deletes that branch from the remote.';
  static FORCED_REFSPEC_REASON = 'git push +<ref> force-updates that ref on the remote, discarding commits only the remote has.';

  static reason(rest) {
    const values = GitPushRewrite.VALUE_OPTIONS;
    const kind = GitPushRewrite.KINDS.find((entry) => GitOptionScan.has(rest, { ...entry.option, values }));
    if (kind) return kind.reason;
    return GitPushRewrite._refspecReason(GitPushRewrite._refspecs(rest));
  }

  static _refspecReason(refspecs) {
    if (refspecs.some((refspec) => refspec.startsWith(':') && refspec.length > 1)) return GitPushRewrite.DELETE_REFSPEC_REASON;
    if (refspecs.some((refspec) => refspec.startsWith('+'))) return GitPushRewrite.FORCED_REFSPEC_REASON;
    return null;
  }

  static _refspecs(rest) {
    const positionals = [];
    for (let i = 0; i < rest.length; i++) {
      if (!rest[i].startsWith('-')) positionals.push(rest[i]);
      else if (GitPushRewrite.VALUE_OPTIONS.includes(rest[i])) i++;
    }
    return positionals.slice(1);
  }
}

module.exports = GitPushRewrite;
