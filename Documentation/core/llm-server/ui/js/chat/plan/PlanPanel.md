# PlanPanel

`core/llm-server/ui/js/chat/plan/PlanPanel.js`

The plan panel above the composer (component `plan`, a
[ComposerStrip](../composer/ComposerStrip.md)): the open conversation's plan, the
steps the model set out with `update_plan`
([PlanTool](../../../../chat/plan/PlanTool.md)), and which step it is on.

## Methods

- `refresh()`: reads the plan from the conversation's meta
  (`api.conv.meta.get(id).meta.data.plan`) when a conversation opens. A host without
  conversation meta has none.
- `onEvent({ conversationId, plan })`: the turn's `plan` chat event, routed by
  [ChatEventRouter](../stream/ChatEventRouter.md). A null plan removes the panel;
  events of another conversation are ignored (its plan is read when it opens).
- `reset()`: on leaving a conversation.
- `attach(bar)`, `paint()`: from the base. `paint()` is also called when a turn starts
  and ends, because Clear depends on it.

## What the user can do

- The chevron folds the panel to one line (count, bar and the step being worked on).
  The choice is kept for the session, across conversations.
- Clear drops the plan from the conversation's meta and keeps the rest of it (read,
  remove `plan`, write back). It is disabled while a reply is being written in this
  conversation, because the turn writes the same meta. It is offered only where
  `conv.meta.set` exists.

## A finished plan

A plan whose every step is done is not shown: the panel leaves the moment the last step
is completed (usually with the final answer) and gives its room back to the
conversation, and a conversation opened with a finished plan in its meta shows none.
The record of the plan is the turn's `update_plan` cards. The page does not touch the
meta for this; the host retires the finished plan when the next turn starts and sends a
`plan` event with no plan. A plan the reply left unfinished stays until it is cleared
or replaced.

Markup comes from [PlanPanelHtml](PlanPanelHtml.md); styles are the `.cm-plan-*` rules
in `chat.css` (`.cm-plan-line` is the gear panel's launch-plan line, unrelated).
