# TurnFinisher

`core/llm-server/chat/bridge/turn/TurnFinisher.js`

Ends a turn on exactly one terminal hook.

## Methods

- `new TurnFinisher({ hooks, mirror, trace, artifacts, health, groups,
  isAborted, closeWork })`.
- `finish({ result, runError })`: reports usage; a thrown run -> trace,
  `onError`; aborted -> trace, `onDone({ finishReason: 'stop', aborted: true })`;
  an error with no answer -> trace, `onError` (`aborted` reads `stopped`);
  otherwise [FinalTextResolver](FinalTextResolver.md), trace, `settleFinal`,
  `onDone(health.doneFields(result))`. `closeWork` runs last each time.
