# NarratorBrief

`extensions/roleplay-mode/prompts/NarratorBrief.js`

The narrator's standing brief, the cacheable head of every turn. In order:

- Role and format: present tense, second person. The protagonist is always
  written as "you" ("You slip past her"), never by name or as "he", "she" or
  "they" in narration; other characters may say the name aloud, and everyone
  else is third person. Plain prose paragraphs, no headings, titles, scene labels,
  lists or notes to the reader; a speaking character's paragraph opens with
  their bold name and a colon.
- `## Stay with what is there`: answer what the player just did, as stated (a
  player who leaves is gone and the scene follows them); use the people, the
  place and the facts the story already holds; add something new only when the
  action or the premise calls for it, one thing, kept small; every detail has
  to matter to this moment; a card's past and what a character keeps private
  stay off the page until the story reaches them, with no hints.
- `## How to write`: concrete detail, no narrated feeling, dialogue that stands
  alone, varied rhythm, one beat, characters know only their card and the
  story so far, growth on the card is the current truth, and the short list of
  phrases to leave out.
- `## The world answers`: characters act on their own wants and may refuse,
  bargain or walk away; the player's choices have consequences; the story
  moves on its own only when the player stalls or repeats themselves, and then
  by one move; player claims about others are contested against the cards.
- `## Length`: the mode as a ceiling ("never more than N words ... that is a
  limit, not a goal"). The scene notes give each reply its own limit, sized to
  the player's move ([NarratorContext](NarratorContext.md)`.lengthRule`): a
  small action or a short line gets two to four sentences. Never pad to reach
  a length.
- `## The player's turn`: stop as soon as the player has something to respond
  to, without inventing a hook to end on; never write the player.

## Methods

- `NarratorBrief.lines(data, { emptyWorld, playerName })`.
- `NarratorBrief.lengthMode(data)` `snappy` | `balanced` | `lush` from
  `data.lengthMode` (or `options.lengthMode`), default `balanced`;
  `LENGTH_MODES` carries each mode's `max` (snappy 90, balanced 180, lush
  320), `words` ("up to N words") and `paragraphs`. The brief and the scene
  notes state the ceiling from `max`.
- `NarratorBrief.AVOID` the short list (about fifteen phrases). The full list
  is [ProseSlop](ProseSlop.md), used by the optional polish pass only, because
  long ban lists confuse small models.

## Why restraint (2026-11-12)

A live session on a 24B model showed what the earlier brief produced. Its
length modes were bands with a floor (40 to 120, 120 to 250 and 250 to 400
words), and the floor padded every reply. "Invent as the story needs" and "end
on a handoff" put a new arrival, a rumour or a neighbour's troubles into each
one. A player who walked out was kept in the room. The section that was
`## The world pushes back` is now `## The world answers`.

The opening instruction (empty world) now ends: no second person, nobody
watching from a distance, no mystery, no closing hook. A replayed opening had
closed on "someone standing outside the pharmacy, watching", and every later
reply kept that figure. The restraint list names the unnamed watcher too.

The format rule now shows speech in quotes straight after the name and names
the script form as wrong. The opening instruction says the player and the
first character have never met unless the premise says otherwise.

The second-person rule also rules out a description of the player ("the cat",
"the stranger") and "it".
