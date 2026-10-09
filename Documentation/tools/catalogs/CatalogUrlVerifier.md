# CatalogUrlVerifier

`tools/catalogs/CatalogUrlVerifier.js`

The catalog smoke test (thin entry `scripts/verify-model-catalogs.js`): HEADs every URL from
[CatalogUrlCollector](CatalogUrlCollector.md) through [UrlHeadProbe](UrlHeadProbe.md), four at a time so HF does
not rate-limit the burst, and prints `OK   [catalog] model · file (N.NN GB)` or `FAIL ... → status|error` followed
by the URL. Resolves exit code 1 when any URL fails, 0 otherwise (`All N URLs resolve.`).

## Methods

- `new CatalogUrlVerifier({ rows?, probe?, log?, error?, concurrency? })`; `execute(args)`. `--list` prints the rows
  and touches no network (a dry run, new in the port).
- Constants: `CONCURRENCY` (4), `GIB`.
