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
| `small-window` | the debt question at a 3k window | memory holds with the history trimmed |

- `context(probe, { request, before })`: checks on the request the narrator was
  sent and the state it was prepared from; they need no model.
- `reply(probe, { reply, after })`: checks on what a real model wrote and what
  the real stage call then recorded.

Both return `[{ name, ok, detail }]`.
