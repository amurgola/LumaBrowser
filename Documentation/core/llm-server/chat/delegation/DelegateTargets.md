# DelegateTargets

`core/llm-server/chat/delegation/DelegateTargets.js`

What a chat can delegate to: the targets of every registered chat mode that
declares a `delegate` block (see [ChatModeRegistry](../ChatModeRegistry.md)).
Read live on every call, so a mode an extension registers or drops later is
picked up without a restart.

## Methods

- `new DelegateTargets({ registry })`: a [ChatModeRegistry](../ChatModeRegistry.md).
- `list()` returns `[{ id, modeId, label, description, params }]`. A mode
  contributes only when `delegate.start` is a function; `delegate.targets` is an
  array or a function returning one (a throwing function contributes nothing).
  The first target to claim an id wins; `label` falls back to the mode's label,
  then its id; `params` to `{}`.
- `find(idOrLabel)` the target by id, else by label (case-insensitive, since a
  model often echoes the label it was shown), else `null`.
- `start(target, args)` calls the mode's `delegate.start({ targetId, args })`
  and returns `{ data, message, title }` (`data` an object, `title` or `null`),
  or `{ error }`: the mode's own error, `did not produce a first message` for a
  blank message, `Could not start "<id>": <msg>` for a throw, or `can no longer
  be delegated to` when the mode went away.

## Current targets

- `build-extension`, `code-project`: [CodeDelegate](../../../../extensions/code-mode/CodeDelegate.md).
- `game`: [GameDelegate](../../../../extensions/game-mode/mode/GameDelegate.md).
- `agent:<agentId>`, one per custom agent: [AgentChatMode](../../../../extensions/agent-manager/AgentChatMode.md).
