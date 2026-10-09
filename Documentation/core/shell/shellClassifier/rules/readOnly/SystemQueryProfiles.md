# SystemQueryProfiles

`core/shell/shellClassifier/rules/readOnly/SystemQueryProfiles.js`

[ProfileGroup](ProfileGroup.md) for system query tools that double as setters or only read in one mode.

- `DATE`: `-s`/`--set`, or an operand not starting with `+` (POSIX time operand), sets the clock.
- `HOSTNAME`: an operand, `-F`/`--file` or `-b`/`--boot` sets the host name.
- `SYSCTL`: `-w`, `-p`, `-f`, `--write`, `--load`, `--system` or a `name=value` operand set kernel parameters.
- `NVIDIA_SMI` (word grammar): every documented GPU-setting option (persistence, compute mode, clocks, power limit,
  ECC, accounting, driver model, MIG, reset) changes state; `-f`/`--filename` writes the report. Also used by
  [CmdBuiltinCatalog](CmdBuiltinCatalog.md).
- `SAR`: `-o` saves samples to a file.
- `STTY`: reads only with no args or `-a`, `-g`, `--all`, `--save`, `size`, `speed`.
- `TOP`: reads only in batch or counted mode (`-b`, `-n`, `-l`).
- `RPM` (`-q`), `LDCONFIG` (`-p`), `XCLIP` (`-o`), `XSEL` (`-o`): read only in that mode. `PBCOPY` never reads.
- `ENV`: alone it prints; a command operand or `-S`/`--split-string` runs one (the classifier usually unwraps it).

## Why

These names are queries in their common form and setters in another; the profile admits only the query form.
