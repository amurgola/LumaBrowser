# GroundingCards

`extensions/roleplay-mode/grounding/GroundingCards.js`

Reads a grounding pack: a folder of markdown files in which every `## Title`
section is one card. A card has a `Tags:` line (the comma separated phrases a
character's description must contain for the card to apply; never shown to
the narrator), an optional `Group:` line (cards of one group are exclusive:
one age band, one pregnancy stage, one height card), an optional `When:` line
(the moment words that call a situational card in the surface pack: boots,
socks, hands), an optional `Unless:` line (idioms that cancel those words for
that card: "cuts through the crowd", "blood orange") and the body lines the
narrator reads. A section without a Tags line is a note and is skipped.

## Methods

- `GroundingCards.load(dir, pack)` -> `[{ id, pack, file, title, tags, when,
  unless, group, body, text, sha256 }]` for every `.md` in `dir`, sorted by file. `id` is
  `<pack>/<slug of the title without its parenthetical>`; `text` (title, tags,
  body) is what the knowledge base indexes; `sha256` hashes `text`.
- `GroundingCards.parse(source, { pack, file })`, `slug(title)`,
  `sha256(text)`.
