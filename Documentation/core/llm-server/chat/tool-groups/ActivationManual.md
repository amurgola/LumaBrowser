# ActivationManual

`core/llm-server/chat/tool-groups/ActivationManual.js`

Data only: the texts that teach the model to load a lazy tool group.

## Members

- `ActivationManual.ACTIVATE`: the always-present manual on unloaded tool groups (also
  exposed as `ToolGroups.ACTIVATE_TOOL_DOC`). To use a group the model calls its tool
  directly: the group loads by itself, the call runs, and the instructions come back with
  its result. A call that starts a render (images, video, music) is named as the exception:
  it is sent back with the instructions first. `activate_tools` is described as the way to
  read a group's instructions without acting yet.
- `ActivationManual.ACTIVATE_NATIVE`: the same manual for a model that takes tools
  natively. The direct way there is `call_tool`, the function that runs the tools of a
  lazily loaded group: they are not registered functions, because the registered array is
  fixed for the conversation ([NativeToolPlan](../bridge/tools/NativeToolPlan.md)). It says
  to pass the group keys in `groups` and leaves out the text-fence call shape, because
  `activate_tools` is a registered function.
- `ActivationManual.CALL_THROUGH_CALL_TOOL`: the line that closes a manual handed to a
  native-tool model when its tools are not registered functions
  ([ToolGroupState](../bridge/groups/ToolGroupState.md)`.callNote`).
- `ActivationManual.INACTIVE_HEADING`: the line above the stub list.
- `ActivationManual.INACTIVE_DIRECTIVE`: the closing rule, which steers widgets to
  `live_artifacts`, documents to `artifacts` and pictures to `images`. It gives the reason
  (the chat shows what the tool makes, which a code block in the reply cannot do) and the
  other direction (a short snippet or a quick answer stays in the reply).
- `ActivationManual.INACTIVE_DIRECTIVE_NATIVE`: the same rule for a native-tool model, with
  "You can call the tool directly: its group loads by itself." replaced by "Run its tool
  with call_tool: its group loads by itself.", since an unloaded tool is not a function it
  can name.

## Direct calls (2026-11-21)

The manual used to open with "Before you use one, load its instructions" and offered the
direct call as a shortcut that returned the docs, to be followed by the same call again.
Both ways cost a model step before anything happened, and a small model took the returned
docs for the result ([AutoActivation](../bridge/groups/AutoActivation.md) has the
figures). A direct call now runs, so the manual sends the model straight to the tool and
keeps `activate_tools` for reading ahead.

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
