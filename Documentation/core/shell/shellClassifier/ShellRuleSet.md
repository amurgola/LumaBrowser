# ShellRuleSet

`core/shell/shellClassifier/ShellRuleSet.js`

Runs every rule over one simple command and picks the decisive verdict.

## Methods

- `ShellRuleSet.RULES`: frozen instances in order GitRule, FilesystemRule, SystemRule, PackagesRule, ReadOnlyRule.
- `ShellRuleSet.assess(command, { readonlyEligible = true })` returns the first `forbidden` verdict from any rule,
  else the first `mass-destructive`, else (only when `readonlyEligible`) the first `readonly`, else `null`.
  `null` means the classifier's generic `normal` tier.

## How the classifier consumes rules

This replaces the hand-ordered chain in legacy `classify.js` `classifyOne`. For each simple command that is not a
wrapper, pipe-to-shell sink or PowerShell expression (those stay in the classifier):

```js
const name = baseName(c.name);                       // lowercased, no path or .exe
const hasFileRedirect = c.redirects.some((r) => !RedirectTarget.isNull(r.target));
const readonlyEligible = c.assignments.length === 0 && !hasFileRedirect;
const verdict = ShellRuleSet.assess({ name, args: c.args, dialect }, { readonlyEligible });
if (verdict && verdict.tier === 'forbidden') return forbidden(verdict.reason);
if (rawDiskRedirect(c.redirects)) return forbidden('Writing to a raw disk device destroys the disk.');
if (verdict) return { tier: verdict.tier, reason: verdict.reason };   // mass-destructive or readonly
return { tier: 'normal', reason: null };
```

Checking the raw-disk redirect after a forbidden verdict and before the rest keeps the legacy reason precedence. The
dialect passed in must already be normalized.

## Why this order

Legacy checked: disk forbidden, delete forbidden, system forbidden, raw-disk redirect, git mass, delete mass, system
mass, infra mass, then the readonly allowlist. Rules are disjoint by command name except where noted in their docs,
and "first forbidden, then first mass" over RULES in this order reproduces that sequence, including which reason is
shown. A differential run of legacy against the port over about 9.4 million rule and parser checks found no
difference other than the two documented bug fixes (pacman `-R`, unit-less systemctl).
