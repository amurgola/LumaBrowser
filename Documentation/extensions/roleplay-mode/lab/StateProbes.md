# StateProbes

`extensions/roleplay-mode/lab/StateProbes.js`

The state probes run from the restored twelve-turn story. Each is one turn
taken from a known point and a set of checks.

| Probe | Turn taken | What it shows |
| --- | --- | --- |
| `continue` | a line to Elena | the scene carries on at home |
| `recall-debt` | asks what Marcus owes | a fact from seven turns back |
| `recall-favour` | asks about the key | a promise and an object |
| `nobody-else` | looks around the flat | nobody who is elsewhere turns up |
| `stall` | says nothing | the lunch break does not come back |
| `phone` | phones Marcus | a call does not put him in the room |
| `seek` | knocks on 2B | someone is found where they were left |
| `regenerate` | regenerates turn 12 | the state rewinds to turn 11 |
| `edit-middle` | edits turn 6 | the state rewinds to the cafe |
| `delete` | deletes turns 11 and 12 | the home scene goes with them |
| `delete-reply` | deletes only the last reply, then a new line | the story stands where the reply before it left it; the unanswered line stays in the history |
| `edit-last` | edits the last message | the state rewinds to turn 11; nothing of the replaced reply remains |
| `regenerate-continue` | regenerates turn 12, then carries on | the next turn follows the new reply (history, events, open thread), not the one it replaced |
| `variant-back` | regenerates turn 12, switches back to the first version, then carries on | the first version's story is back; nothing of the other branch |
| `small-window` | the debt question at a 3k window | memory holds with the history trimmed |

- `context(probe, { request, before })`: checks on the request the narrator was
  sent and the state it was prepared from; they need no model.
- `reply(probe, { reply, after })`: checks on what a real model wrote and what
  the real stage call then recorded.

Both return `[{ name, ok, detail }]`.

## Changes (2026-11-14, the branch probes)

- A probe's action may carry `after`: what the user did first, in order (`{ type: 'regenerate', turn, alternate? }`, `{ type: 'delete-reply', turn }`, `{ type: 'show-first', turn }`), which the runner plays before the turn under test.
- `expect.historyMessages` checks the history against the branch on screen as the store holds it (`stored`, handed in by the runner): the right number of messages, each the stored one in order. It is what a branch whose replies are not the script's needs (a regenerated reply, a line left unanswered).
- `expect.scripted` holds expectations only a scripted model can meet (they name what [RestoredStory](RestoredStory.md)`.alternateTurn()` said); `expectations(probe, contextOnly)` merges them in on a run without a model.
- `context(probe, { request, before, stored, contextOnly })`.

The four new probes are the cases a player hits most: deleting the last reply, editing the last message, carrying on after a regeneration, and paging back to the first version. All pass without a model (the jest regression) and on Qwen3.8-27B (7 of 7 branch probes, 109 context and 37 reply checks, 2026-11-14).
