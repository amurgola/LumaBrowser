# PlainReaderProfiles

`core/shell/shellClassifier/rules/readOnly/PlainReaderProfiles.js`

[ProfileGroup](ProfileGroup.md) of utilities with no write, exec or state-changing option at all, as plain
[UtilityProfile](UtilityProfile.md)s. `GROUPS` lists `{ summary, names }`, names alphabetical within each group:
text printers and filters, comparators, byte dumps, checksums, path and file metadata, users and sessions, system
and process state, network lookups, binary inspectors, literals and arithmetic, package queries, `jq`, `pbpaste`,
and documentation/lookup.

## Why

Each name was checked against its POSIX, GNU or BSD documentation. Utilities that only read in some forms are
deliberately absent and live in the guarded groups: `sort` (-o, --compress-program), `uniq` and `xxd` (output
operand), `tree` (-o, -R), `file` (-C), `date` and `hostname` (setters), `less` (-o), `man` (-P, -H), `base64`
(-o), `curl`, `ifconfig`, `ss` (-K), `sar` (-o), `bat`/`ag` (--pager). `dc` is not listed at all because its `!`
command runs a shell command.
