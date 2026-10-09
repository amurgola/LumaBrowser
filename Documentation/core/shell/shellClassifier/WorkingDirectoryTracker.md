# WorkingDirectoryTracker

`core/shell/shellClassifier/WorkingDirectoryTracker.js`

Follows directory changes through a command line so later relative write targets resolve where they will really run.

## Methods

- `new WorkingDirectoryTracker(start, scope, env)` with a [WritePathScope](WritePathScope.md).
- `WorkingDirectoryTracker.changesDirectory(name)`: cd, chdir, set-location, sl, pushd, push-location, popd,
  pop-location.
- `change(name, args)` applies one change and returns `"<name> <target>"` when the destination could not be resolved
  (the cwd becomes unknown), else `null`.
  - The target is `-Path`/`-LiteralPath` (via [PowerShellArgs](PowerShellArgs.md)) or the first non-flag word.
  - popd pops the stack; push variants push the current dir first; no target goes home; a `-` target returns to the
    top of the stack. An empty stack or no home makes the cwd unknown.
  - Quirk kept from legacy: `cd -` has no non-flag word, so it reads as a bare `cd` (home). Only `-Path:-` reaches the
    `-` branch.
- `resolve(word)`: the absolute path, or `null` when a variable stays unresolved or the word is relative while the
  cwd is unknown.
- `cwd`, `known`.
