# ComposeIntent

`core/llm-server/ui/js/chat/modes/ComposeIntent.js`

Applies a "compose" chat intent another surface left through
`LLMServerService.setChatIntent({ compose })` (the Desktop Integration
extension's [ChatHandoff](../../../../../../extensions/desktop-integration/shared/ChatHandoff.md)
is the first caller): a fresh conversation, the attachments staged in the
composer strip, the prompt in the composer and, when asked, sent. It rides the
same one-shot pull as mode intents, so a chat tab that is still loading picks it
up once its mode list is ready ([ModeLauncher](ModeLauncher.md)`.checkPendingIntent`).

## Methods

- `ComposeIntent.is(intent)`: true for `{ compose: {...} }`.
- `apply({ conversationId?, prompt, attachments, autoSend })`:
  - with `autoSend` and a `conversationId` (created by the launcher so it can
    return the id), refreshes the list, opens that conversation, marks it a
    first turn (so the reply titles it) and sends;
  - otherwise shows the New-chat landing with the attachments staged and the
    prompt filled in, focused, for the user to send.
  - Attachments are in the composer's shapes (`{ kind:'text'|'pdf', name, text }`,
    `{ kind:'image', name, mime, base64 }`); entries with `error` are dropped.
  - With no model picked, or a turn still streaming, nothing is sent; the prompt
    is only filled in.
