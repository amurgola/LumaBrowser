# NetworkProfiles

`core/shell/shellClassifier/rules/readOnly/NetworkProfiles.js`

[ProfileGroup](ProfileGroup.md) for network clients and interface tools.

- `CURL`: writes a local file with `-o`, `-O`, `-c`, `-D` and the long output, cookie-jar, header-dump, trace,
  stderr, libcurl, etag, hsts and alt-svc options; sends data with `-d`, `-F`, `-T`, `--data*`, `--json`,
  `--form*`, `--upload-file`, `--mail-rcpt`; `-X`/`--request` other than GET, HEAD or OPTIONS can change the
  server; `-K`/`--config` is unverifiable. Value letters are declared so `-H "-o"` stays a header.
- `PING`: reads only with a count or deadline (`-c`, `-n`, `-w`); otherwise it runs until stopped.
- `SS`: `-K`/`--kill` closes sockets.
- `IFCONFIG`: at most one operand (the interface); more reconfigure it.
- `IP` (word grammar): `add`, `append`, `change`, `del`, `delete`, `exec`, `flush`, `prepend`, `replace`, `set`
  among the operands change configuration or run a command; `-b`/`-batch` is unverifiable.

## Why

A plain GET or query reads; anything that saves locally, sends a body, changes the remote side or reconfigures the
host does not.
