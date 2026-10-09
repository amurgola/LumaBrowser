# ActionEvidence

`core/browser/ActionEvidence.js`

Diffs the page fingerprints taken before and after an input action into evidence.

## Methods

- `ActionEvidence.compare(before, after, ctx)` returns
  `{ outcome, changes, note?, stateKey?, settled?, waitedMs? }`. Pure: every input
  is a plain value. `ctx` is `{ navigated, inPage, url, newTabs: [{ id, url }], settle }`.
  - `outcome` is one of `new_tab`, `navigated`, `dialog`, `changed`, `no_change`, `unknown`,
    in that precedence.
  - `changes` is human-readable (`'url changed to ...'`, `'focus moved to input "Search"'`,
    `'text grew by 420 chars'`, `'a new tab opened (tab 9): ...'`). At most three new tabs are listed.
  - `note` explains `no_change` and `unknown`.
- `ActionEvidence.stateKey(fp)` returns a short hash of url, text, interactive
  elements, dialogs and scroll, or `null` for a non-fingerprint.
- `ActionEvidence.isFingerprint(x)` is true for an object produced by the in-page `__lumaFp()`.

## Why

The commonest web-agent failure is not an error: a click lands on nothing,
reports `success: true`, and is repeated or reported as done. A trusted click
"succeeds" the moment the event is delivered. Evidence gives the agent
something better to reason from, and the chat loop (tool ledger, AgentRunner)
uses `stateKey` to spot "the same no-op, again", so the key must be stable
across a no-op and change once anything meaningful moves.

A missing after-snapshot without a navigation is `unknown`, never `no_change`:
the page did not answer (a native alert may be blocking it).

Focus landing on the clicked button or link is ignored, because clicking
focuses it whether or not anything listens; counting it would make every dead
button look live. Focus landing in a text field (including `input[email]`,
`textarea`, `combobox`) is reported.

Values in changes are clipped (urls 160 or 120, title and dialog 60, labels 40) with `…`.
