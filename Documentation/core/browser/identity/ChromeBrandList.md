# ChromeBrandList

`core/browser/identity/ChromeBrandList.js`

Port of Chromium's GREASE brand generation and brand shuffle.

## Methods

- `ChromeBrandList.build(seed, version, greaseVersionSuffix)` returns three
  `{ brand, version }` entries (the GREASE brand, `Chromium`, `Google Chrome`)
  in the order Chromium shuffles them for `seed` (the major version). The
  suffix is appended to the GREASE version only (`'.0.0.0'` for the full-version list).
- `ChromeBrandList.toHeader(list)` renders `"brand";v="version", ...`.

## Why

Sec-CH-UA must be byte-identical to real Chrome of the spoofed version, so
this follows `components/embedder_support/user_agent_utils.cc`
(`GetGreasedUserAgentBrandVersion`, `GetRandomOrder`,
`GenerateBrandVersionList`). Tests pin the output of Chrome 120, 124, 131, 138 and 154.
