# MediaModelChoice

`core/llm-server/ui/js/chat/composer/MediaModelChoice.js`

This chat's own image, image editor and video model: the "Media models" rows of
the gear panel ([GearPanel](GearPanel.md)). Each row is a `.cm-gear-field`
label with a select: "Default (name)" first, naming what Setup would use, then
every installed model for that job. A pick is `state.mediaModels[job]`
(`image`, `edit`, `video`); choosing Default removes it.

## When the rows show

- Only where the surface can list models and keep a pick (`available()`:
  `api.image.getModelsView` and `api.conv.meta`). The web client has neither.
- Only once the image engine is set up: `api.image.getEnabled()` is `true` and
  the defaults carry a `runtimeId`.
- One row per job that has a model installed, grouped the way Image Setup
  groups them ([ImageDefaultsMarkup](../../image-setup/ImageDefaultsMarkup.md)`.modelGroups`:
  a unified generate and edit model is offered for both jobs).
- A job whose active image server is a paired computer
  (`api.image.getServerConfigs()`, a `remote` entry) is shown with that server's
  name in a disabled select: the model is chosen there and a pick made here
  would be ignored.
- With no edit default the Default option reads "Default (the image model)",
  since edits then run on the generation model.

## Where a pick is kept

In the conversation's meta as `data.mediaModels`
([ConversationMediaModels](../../../../chat/router/ConversationMediaModels.md)).
The select writes it onto an open conversation at once (a read-modify-write,
since `meta.set` replaces the data bag whole). A landing chat has no row yet:
its first turn carries the picks ([TurnFlags](../stream/TurnFlags.md),
`mediaModels`) and the router stores them.
[ConversationView](../conversation/ConversationView.md) restores them when a
conversation is reopened; New chat and a mode launch reset them
(`ChatState.resetChatOptions`).

`state.mediaModels` is `null` until something is picked or restored: null means
"no say", the turn sends no `mediaModels`, and the router leaves what is stored
alone. So a failed meta read never clears a conversation's picks.

A stored pick whose model is no longer installed shows as Default, which is
also what the tools fall back to; the pick itself is left in the meta in case
the model comes back.

## Methods

- `available()`.
- `restore(conversationId)`: sets `state.mediaModels` from the conversation's
  meta, or leaves it null where it cannot be read.
- `render(holder, binding?)`: fills a holder in the gear panel with the
  section, or leaves it empty. Without a binding the picks are the
  conversation's own (`state.mediaModels`, the general `.cm-gear-media`
  holder). A chat mode that keeps its image models in its own data passes
  `{ jobs?: [job], picks(): { job: id }, pick(job, id) }` through the gear
  hook's `panel.mediaModels(holder, binding)`: only the jobs it names are
  listed, `picks()` is read when the rows are built, and `pick` is called on
  every change (an empty id is back to Default). Nothing is written to the
  conversation's `mediaModels` in that case.
- `JOBS`, `META_KEY`.

## Globals

None.
