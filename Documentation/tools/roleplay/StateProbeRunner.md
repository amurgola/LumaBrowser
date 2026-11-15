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

## Changes (2026-11-14, steps before the turn)

`run` plays `probe.action.after` first (`_prelude`): a regeneration is a whole turn through the router with its bookkeeping (with `alternate`, a run without a model switches the dispatcher to `RestoredStory.script({ alternate: true })` so the regenerated reply differs), `delete-reply` deletes that turn's reply alone, `show-first` makes the first version of a regenerated reply the active one (`store.setActiveVariant`, the pager under a reply). `_plan` also returns `history`, the stored messages of the branch the turn continues from, which the context checks compare the sent history against. A live run goes live before the prelude, so the model writes the regenerated reply too.
