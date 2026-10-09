# ShellRule

`core/shell/shellClassifier/ShellRule.js`

Base class (the interface) for every shell classifier rule.

## Contract

A rule implements `assess(command)` where `command` is `{ name, args, dialect }`:

- `name` is the command's base name: lowercased, no directory, no `.exe/.cmd/.bat/.com` (the classifier's
  `baseName`). Rules also lowercase it themselves, so a raw name is tolerated.
- `args` are the parsed argument words in their original case.
- `dialect` is already normalized to `posix`, `powershell` or `cmd` (use [ShellDialect](ShellDialect.md)`.normalize`
  first; rules compare it literally).

It returns `null` for "no opinion" or a verdict `{ tier, reason }`:

- `forbidden`: auto-denied, no approval can allow it. `reason` is a sentence for the user.
- `mass-destructive`: always asks a human, even in relaxed approval modes. `reason` is a sentence for the card.
- `readonly`: safe to run without asking. `reason` is `null`.

A rule returns its single worst verdict. It must never throw and never mutate its input.

## Methods

- `rule.assess(command)` throws in the base class.
- `ShellRule.forbidden(reason)`, `ShellRule.massDestructive(reason)`, `ShellRule.readonly(isReadOnly)` build a
  verdict, or return `null` when the reason is empty or the flag false.
- `ShellRule.firstApplicable(branches, ...input)` returns the first branch result that is not `undefined`. Rule
  branches are keyed by command name: `undefined` means "not mine", any object (even one with no reasons) means "mine"
  and stops the search, exactly like the legacy early returns.
- Constants: `FORBIDDEN`, `MASS_DESTRUCTIVE`, `READONLY`, `VERDICT_TIERS`.

## Implementations

[GitRule](rules/GitRule.md), [FilesystemRule](rules/FilesystemRule.md), [SystemRule](rules/SystemRule.md),
[PackagesRule](rules/PackagesRule.md), [ReadOnlyRule](rules/ReadOnlyRule.md). Consumers should go through
[ShellRuleSet](ShellRuleSet.md), which runs them in order and applies precedence.
