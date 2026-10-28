# LabTextScenario

`extensions/roleplay-mode/lab/LabTextScenario.js`

The Lab's scripted text playthrough: a harbour town under curfew with a
protagonist (Rook), three profiled characters (Mara with a scar and a secret,
Teo the harbourmaster, Old Mott the lamplighter) and a seeded ledger (the stolen
key). Ten player turns plant facts, kill Mott on turn 5, and ask about the scar,
the debt and the key on turns 7 to 9.

## Methods

- `LabTextScenario.build()` -> `{ data, turns, facts }`; `data()` the seeded
  world; `TURNS`; `FACTS` (`{ id, label, keywords, askTurn?, deathTurn?,
  character? }`).
- `LabTextScenario.canned()` side-call replies for a mocked run: the stage keeps
  the cast as it was and reports nothing new, so only what the narrator does
  with the seeded memory is graded.
