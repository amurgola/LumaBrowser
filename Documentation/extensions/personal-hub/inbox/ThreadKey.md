# ThreadKey

`extensions/personal-hub/inbox/ThreadKey.js`

Normalises the text notifications are grouped by (a subject, a channel name,
a contact) so replies, forwards and mailer noise land on the same thread.

## Methods (static)

- `normalize(text)`: lowercases, removes every bracketed tag (`[EXTERNAL]`,
  `[JIRA]`, `[Ticket #12]`), strips stacked leading reply/forward prefixes
  (`re:`, `fw:`, `fwd:`, `aw:`, `wg:`, `sv:`, `tr:`, also `re[2]:`),
  collapses whitespace, trims and caps at `MAX_LENGTH` = 120. `''` for
  empty or null input.
- `fromParts(...parts)`: the non-empty normalised parts joined with `|`.

## Why

A Gmail notification for "Re: Invoice 42" and the later "Fwd: [EXTERNAL]
Invoice 42" are one conversation to the user; the key makes them one thread
in the queue.
