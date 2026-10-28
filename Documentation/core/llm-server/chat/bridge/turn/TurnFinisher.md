# TurnFinisher

`core/llm-server/chat/bridge/turn/TurnFinisher.js`

Ends a turn on exactly one terminal hook.

## Methods

- `new TurnFinisher({ hooks, mirror, trace, artifacts, health, groups,
  isAborted, closeWork })`.
- `finish({ result, runError })`: reports usage; a thrown run -> trace,
  `onError`; aborted -> trace, `onDone({ finishReason: 'stop', aborted: true })`;
  an error with no answer -> trace, `onError(errorOf(result))`;
  otherwise [FinalTextResolver](FinalTextResolver.md), trace,
  `settleFinal(text, isAborted, { charsPerSecond: health.charsPerSecond() })`,
  `onDone(health.doneFields(result))`. `closeWork` runs last each time.
- `TurnFinisher.errorOf(result)`: the Error for a run without an answer
  (`aborted` reads `stopped`). A run the wall clock ended (`result.timedOut`)
  carries `code: AGENT_TIMEOUT` and `setting: { tune: 'agentTimeoutMinutes' }`,
  which [LaunchErrorHints](../../router/LaunchErrorHints.md) puts on the error
  event so the chat's [ErrorCard](../../../ui/js/chat/turns/ErrorCard.md) can
  offer to edit the model's Run timeout.
