# ShellClassifier

`core/shell/shellClassifier/ShellClassifier.js`

Classifies one shell command line into a safety tier with human-readable reasons. This is the safety gate the agent
approval flow consults before running a shell command.

## Tiers

- `readonly`: every simple command is on the read allowlist and none redirects to a file. Runs without asking.
- `normal`: anything the rules have no stronger opinion about (a build, an install, a commit, `echo > file`).
  Follows the usual approval policy.
- `mass-destructive`: recursive deletes, history rewrites, publishes, prunes, infra teardown, pipes into a shell,
  hidden code (encoded PowerShell, Invoke-Expression on a variable). Always asks a human.
- `forbidden`: wrecks the host or hides what it runs (rm -rf /, format, dd to a device, firewall off, a download
  piped into a shell, fork bombs, raw-disk redirects, elevated writes). Auto-denied.

## Methods

- `ShellClassifier.classify(command, { dialect = 'auto', platform })` returns
  `{ tier, reasons, commands, dialect, guessedDialect? }`.
  - `reasons`: deduplicated, worst tier's reasons first.
  - `commands`: one verdict `{ name, args, tier, reason }` per simple command, flattened. Wrapped lines and
    substitutions appear as a summary `{ name: <inner line, cut to 80 chars>, args: [], tier, reason, inner }`.
  - An explicit dialect is normalized (`bash` -> `posix`, `pwsh` -> `powershell`) and reported as such. `auto` reports
    `dialect: 'auto'` plus `guessedDialect`.
  - Empty input is `readonly`; it never throws on malformed input.

## How a line is classified

1. Empty is readonly; nesting deeper than `MAX_DEPTH` (6) is normal ("Nested too deeply to inspect."); a fork bomb
   is forbidden.
2. [ShellParser](ShellParser.md) splits the line into simple commands. The chain's tier is the worst of its parts
   ([ShellTier](ShellTier.md)).
3. Per simple command:
   - Pure `VAR=value` assignments: only their `$(...)` substitutions are classified.
   - A PowerShell expression segment (`$x = ...`, `$_.CPU -gt 1`): the right-hand side of an assignment is
     classified as a line; a bare expression is a read.
   - Otherwise the command name is reduced by [ShellCommandName](ShellCommandName.md), every substitution in its
     words is classified ([CommandSubstitution](CommandSubstitution.md)), and the lead verdict is the first of:
     [PipeToShell](PipeToShell.md); a wrapper unwrapped by [ShellWrapper](ShellWrapper.md) and classified in its own
     dialect (elevated inner writes become forbidden, elevated reads stay normal; a file redirect demotes a readonly
     inner line to normal); then [ShellRuleSet](ShellRuleSet.md) exactly as its doc describes, with the raw-disk
     redirect check between the forbidden and the remaining verdicts.
4. Dialect `auto`: classify in [ShellDialect](ShellDialect.md)`.guess`'s dialect, then in each other dialect; another
   dialect may only replace the result when it says `mass-destructive` or worse and is worse than the current one, so
   a misparse never skips a danger but `dir` keeps its Windows readonly verdict.
