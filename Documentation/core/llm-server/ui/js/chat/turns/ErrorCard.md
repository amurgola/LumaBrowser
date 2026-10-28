# ErrorCard

`core/llm-server/ui/js/chat/turns/ErrorCard.js`

The card under a failed turn. The raw error picks a plain-language title and
hint (first match wins): run timed out, context too long, key or permission
rejected, rate limited or overloaded, model unreachable, model not ready, else
"Something went wrong.". The raw text is shown underneath in small mono. A
Stop before any text (`stopped`) is a muted card with no detail.

The way out sits on the right:

- Retry regenerates the turn in place, on the newest reply only (an older
  failed turn retries from its action row).
- A timed-out run (`Execution timed out after ...`) offers Continue instead:
  its tool effects are already applied, so the next turn sends "continue"
  (`CONTINUE_TEXT`) and picks up from there. Newest reply only, never while
  streaming.
- "Edit setting": when the failure is down to a setting, a button named for
  it ("Edit run timeout", "Choose a model", "Open Setup") opens that setting
  outlined through [SettingLink](SettingLink.md). The target comes from the
  host's error meta (`errorMeta.setting`, which wins because the host knows
  the cause) or from the matched kind's `setting`. The button is left out
  where the link cannot open it (a Tune target on the web client).

The timed-out kind is listed first on purpose: its text says "timed out",
which the unreachable-model kind would otherwise claim.

## Methods

- `create(message)`: the card element (`.cm-error`, `role="alert"`); reads
  `message.error` and `message.errorMeta`.
- `ErrorCard.describe(error, meta?)`: `{ title, hint, setting, continuable,
  muted }`; `setting` is a SettingLink target or null.
- `ErrorCard.KINDS`, `STOPPED`, `CONTINUE_TEXT`.

## Globals

None.
