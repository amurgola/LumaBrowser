# SysdepsLinkerParser

`core/shared/runtime/SysdepsLinkerParser.js`

Parses dynamic-linker tool output for the system-library preflight.

## Methods

- `SysdepsLinkerParser.parseLdconfig(stdout)` returns a `Set` of the sonames
  listed by `ldconfig -p` (lines like
  `\tlibgomp.so.1 (libc6,x86-64) => /lib/.../libgomp.so.1`).
- `SysdepsLinkerParser.parseLddNotFound(stdout)` returns the unique sonames
  `ldd` marks as missing (lines like `\tlibgomp.so.1 => not found`), in first
  seen order.

Both accept CRLF and tolerate null or empty input.
