# ActivationManual

`core/llm-server/chat/tool-groups/ActivationManual.js`

Data only: the texts that teach the model to load a lazy tool group.

## Members

- `ActivationManual.ACTIVATE`: the always-present `activate_tools` manual
  (also exposed as `ToolGroups.ACTIVATE_TOOL_DOC`).
- `ActivationManual.ACTIVATE_NATIVE`: the same manual for a model that takes tools
  natively. It says to pass the group keys in `groups` and leaves out the text-fence call
  shape, because `activate_tools` is a registered function there.
- `ActivationManual.INACTIVE_HEADING`: the line above the stub list.
- `ActivationManual.INACTIVE_DIRECTIVE`: the closing rule, which steers widgets to
  `live_artifacts`, documents to `artifacts` and pictures to `images`. It gives the reason
  (the chat shows what the tool makes, which a code block in the reply cannot do) and the
  other direction (a short snippet or a quick answer stays in the reply).

## Wording (2026-11-18)

Every Tools-on turn carries these texts, so they are written plainly: what to do and why,
no shouted words. The directive used to read "IMPORTANT: match the user's request to a
capability below and USE it; do not improvise... Do NOT answer such a request with a plain
code block", and the manual said "NOT loaded yet", "IMMEDIATELY" and "AUTO-activates".
Anthropic, OpenAI and Google all report that current models over-apply emphasis of that
kind, and a rule about tools that states one direction only pulls toward tools.
On the prompt bench (Qwen3.8-27B, three trials a case) the routing cases held after the
rewrite: a README and a tip calculator still went to `create_artifact` and
`create_live_artifact`, and a one-line snippet stayed in the reply.

The lazy group manuals ([ArtifactManuals](ArtifactManuals.md), [MediaManuals](MediaManuals.md),
[UtilityManuals](UtilityManuals.md)) were not rewritten: their emphasis marks failures seen
on small local models, and the bench does not exercise them widely enough to show that a
plainer wording is safe.

[ToolGroups](../ToolGroups.md)`.buildInactiveRegistry` joins them around the
stub lines.
