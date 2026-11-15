# TriggerMemoryFollowUp

`core/llm-server/chat/trigger-runner/TriggerMemoryFollowUp.js`

The safety net of a trigger with persistent memory
([TriggerMemoryPolicy](../trigger-store/TriggerMemoryPolicy.md)): a run that ended
without calling `save_memory` ([SaveMemoryTool](SaveMemoryTool.md)) gets one short
completion that writes the notes from what just happened.

## Methods

- `new TriggerMemoryFollowUp({ complete, triggerStore, emitEvent?, log? })`.
  `complete(opts)` is the chat router's side completion and resolves `{ text }` or
  `{ error }`.
- `save({ trigger, modelRef, event, response })`: resolves the tool-trace entry of
  the save (`{ tool: 'save_memory', params: { notes }, status: 'ok', error: null,
  summary }`), or null when the trigger keeps no memory, the model wrote nothing,
  or the call failed. Never throws: a failure is logged.
- Statics: `TOOL`, `NOTHING` (`NONE`), `TIMEOUT_MS` (60 s), `EVENT_CHARS` and
  `RESPONSE_CHARS` (2000 each), `SUMMARY`, `SYSTEM`.

## How the notes are written

The request holds the notes as they are now (read fresh from the store), the event
the run received and the answer it gave (each cut to its limit), and asks for the
complete updated notes up to the policy's `maxChars`. The run is always to be
recorded, in a line if it was routine; notes that already cover it come back
unchanged. An empty reply (or a bare `NONE`) saves nothing. Thinking blocks are
stripped
([ThinkingText](../../../shared/text/ThinkingText.md)). Notes are stored with
`triggerStore.setMemory` (capped by the policy) and `triggers-changed` is emitted.

## Why

The run's own instructions ask the model to call `save_memory` before its final report ([TriggerMemoryBlock](../triggers/TriggerMemoryBlock.md)), but a model told to "reply with X and nothing else" skips it, so a prompt-mode trigger kept no notes at all. The follow-up asks for notes outright: given the choice, the same model called a first event not worth remembering and still kept nothing. It costs one short model call, and only for runs that saved nothing.
