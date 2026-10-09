# ViewerProfiles

`core/shell/shellClassifier/rules/readOnly/ViewerProfiles.js`

[ProfileGroup](ProfileGroup.md) for viewers, encoders and documentation readers.

- `LESS`: `-o`/`-O`/`--log-file`/`--LOG-FILE` copy input to a log file.
- `MAN`: `-P`/`--pager` and `-H`/`-X`/`--html`/`--gxditview` run programs.
- `INFO`: `-o`/`--output` writes. `TLDR`: `-u`/`--update`/`--clear-cache` rewrite its cache.
- `BAT` (`bat`, `batcat`): `--pager` runs a program; the `cache` subcommand rebuilds or clears its cache.
- `TREE`: `-o` writes the listing; `-R` writes `00Tree.html` into every directory.
- `FILE`: `-C`/`--compile` writes a compiled magic file.
- `XXD` (word grammar): a second operand is the output file.
- `BASE_ENCODERS` (`base32`, `base64`): BSD/macOS `-o`/`--output` writes.

## Why

Displaying is a read; each hazard is a documented option that writes a file or starts another program.
