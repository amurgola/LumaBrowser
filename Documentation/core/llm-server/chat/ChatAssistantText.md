# ChatAssistantText

`core/llm-server/chat/ChatAssistantText.js`

The model-facing wording that says who the chat assistant is, what day it is and how it answers. Data only;
[PlainChatPrompt](router/PlainChatPrompt.md) builds the Tools-off prompt from it and
[AgentTurnDispatch](router/AgentTurnDispatch.md) gives a Tools-on chat turn its role and answering block, so the
assistant is the same one whichever way the Tools switch is set.

## Members

- `ROLE_PLAIN`: the assistant in LumaBrowser's chat, on a model the user picked.
- `ROLE_TOOLS`: the same assistant with tools: it answers from what it knows and acts with tools (a real browser
  and the tool groups) when a request needs more, one step at a time until the request is done. Until 2026-11-18
  every Tools-on turn opened with "You are LumaBrowser's browser agent", whatever was asked.
- `WHEN_TO_USE_TOOLS`: three lines. Many requests need no tool (a greeting, a known fact, a calculation, a
  rewrite, a short snippet); a tool is for what only a tool gives (a live page or current information, a browser
  action, something to render); and a tool the user asks for, by name or by what it does, is used even when the
  answer is already known. Stating one direction only pulls a model that way: with the first two lines alone
  Qwen3.8-27B, asked to "search the web" for a fact it knew, answered from memory in 3 of 5 runs
  (`npm run bench:prompt`, 2026-11-18); with the third line it searched in 6 of 6.
- `toolsAnswering()`: the Tools-on `<answering>` block, `WHEN_TO_USE_TOOLS` then `ANSWERING`.
- `ANSWERING`: three lines. Answer at the length the question needs (one word when one word is asked for); plain
  prose, with a list, table, headings or code block when the content has that shape; knowledge ends at the training
  cutoff, so say when a fact is uncertain or newer than that.
- `UNFAMILIAR_NAMES`: one sentence for a name the model was given no context for (a person, a company, a product,
  a project): memory offers a plausible match that is usually someone or something else, so do not state who or
  what it is and do not add guessed details to a search; look the name up exactly as written first and build on
  what comes back. Asked to "make a plan and research" such a name, Qwen3.8-27B wrote who the person "is" before
  its first search in 23 of 50 runs without the line, in 7 of 50 with it inside `<answering>`, and in 0 of 25 with
  it after the request (engine-level runs at temperature 0.7, 2026-11-26); "Who is Linus Torvalds?" was still
  answered directly, with no search, in 10 of 10.
- `requestReminder()`: `UNFAMILIAR_NAMES` inside a `<reminder>` block. A Tools-on chat turn writes it once after
  the user's request ([AgentTurnDispatch](router/AgentTurnDispatch.md) `requestReminder`,
  [BridgeRun](bridge/BridgeRun.md)); a Tools-off turn does not carry it, since it has nothing to look a name up
  with.
- `NO_TOOLS`: Tools are off here, so nothing can be browsed, searched or opened; say what memory gives and mention
  that turning on Tools allows it.
- `USER_INSTRUCTIONS_LEAD`: the sentence above the user's custom prompt (their instructions win over the defaults);
  it is [SystemPromptText](../agent/SystemPromptText.md)`.USER_INSTRUCTIONS_LEAD`, the one the Tools-on prompt uses.
- `today(now)`: returns [SystemPromptText](../agent/SystemPromptText.md)`.today(now)`, the one date sentence
  both kinds of turn use: `Today is Wednesday, November 18, 2026, in the user's local calendar. ...`. The local calendar day
  in a fixed English format, with no time of day: the line sits at the head of the prompt, where a ticking minute
  would make a local server re-read the whole conversation
  (see [SystemPromptAppend](bridge/prompt/SystemPromptAppend.md)).

## Wording rules

Written the way the vendors' current guidance asks (reviewed 2026-11-18): say what to do, give the reason where it
is not obvious, no all-caps emphasis. Each rule is stated once.
