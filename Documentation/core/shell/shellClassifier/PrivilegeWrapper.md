# PrivilegeWrapper

`core/shell/shellClassifier/PrivilegeWrapper.js`

Recognizes privilege-escalation wrappers and extracts the command they run.

## Methods

- `PrivilegeWrapper.unwrap(name, args)` returns the inner command words, or `null` when `name` is not one of
  `PrivilegeWrapper.NAMES` (sudo, doas, su, pkexec, runas, gsudo, sudo.exe).
  - `su -c "<cmd>"` and `runas /user:X "<cmd>"` split their command string on whitespace.
  - sudo-like wrappers skip their own flags, the values of `-u --user -g -p -h -C -r -t`, and a `--`.
- `PrivilegeWrapper.ESCALATED_WRITERS`: inner commands that make an elevated call forbidden (deleters, copiers,
  permission and disk tools, service and package managers, account tools, and shells or interpreters).

## Why

The classifier unwraps `sudo x` and classifies `x`; if `x` is a writer (or anything mass-destructive or worse), the
elevated call is forbidden, while an elevated read stays normal because it still runs as root. The naive split is
fine because the full parser re-reads the joined words.
