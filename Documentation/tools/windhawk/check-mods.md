# check-mods

`tools/windhawk/check-mods.js`

`npm run windhawk:check` compile-checks every `integrations/windhawk/*.wh.cpp`;
`npm run windhawk:check -- <path>` checks one mod. Prints `PASS`/`FAIL` per mod
and `ok`/`FAIL`/`skip` per target, with the compiler output for failures and
warnings. Exits 1 when any mod fails, 0 with a notice when the Windhawk
compiler is not installed. The work is [WindhawkModChecker](WindhawkModChecker.md).
