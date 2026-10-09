# CardText

`core/llm-server/chat/approval/CardText.js`

Clips a value for a one-line approval card.

## Methods (all static)

- `clip(value, max = 60)`: the value as a string (`null` and `undefined` are
  empty), cut to `max` characters plus `ELLIPSIS` (`…`) when longer.

## Why

A long path, URL or command must not push the approval card off screen.
Shared by [CallDescriber](CallDescriber.md) and
[CommandCallAssessor](CommandCallAssessor.md).
