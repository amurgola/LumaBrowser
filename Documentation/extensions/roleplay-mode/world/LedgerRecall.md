# LedgerRecall

`extensions/roleplay-mode/world/LedgerRecall.js`

Picks the older events worth putting back in front of the narrator this turn.
The narrator is shown the ledger's newest rows and a summary; late in a long
story a debt, a promise or a secret from forty turns back was one clause in a
paragraph, or gone.

- `pick(rows, { query, present, exclude, turn, max })`: each row not already
  shown is scored by relevance (words and names shared with what the player
  just wrote; a name counts double), importance (`IMPORTANCE`: promise, reveal
  and death 3, injury 2, event 1, move 0.5) and recency (a mild decay). A row
  is recalled when the player's line touches it (one shared word for an
  important row, two for an ordinary event), or when it is a promise, a reveal
  or a death about someone on stage. At most `MAX` (4), oldest first.
- `keep(rows, max)`: over the cap, the oldest of the least important rows go
  first. `StoryLedger.record` trims with it.
- `words(text)`: the meaningful words of a text, lightly stemmed.

`NarratorContext._story` prints the picked rows under "From earlier, relevant
now:", each with its turn.
