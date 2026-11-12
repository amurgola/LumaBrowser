# StateProbeRunner

`tools/roleplay/StateProbeRunner.js`

Restores the scripted twelve-turn story through the app's real chat router and
the real roleplay mode (a `SwitchDispatcher` answers from the story's script),
then takes one turn from it per state probe and checks what happened. Each
probe gets its own fresh restore.

- `restore({ window })` resolves a session: router, store, conversation id,
  dispatcher, the ids of each turn's messages, `state(ids?)` and `close()`.
- `run(probe)` resolves `{ id, context, reply, request, replyText, before,
  after, passed, error? }`. With a live dispatcher the probe's turn and its
  bookkeeping go to the real model; without one the run is context only.
- `runAll({ ids, onResult })`, `StateProbeRunner.report(results)`.
