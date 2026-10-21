# AgentPicker

`extensions/agent-manager/ui/AgentPicker.js`

## Methods

- `AgentPicker.pick(agents)`: a fixed `.cm-model-pop` (model-popover
  styles, `data-cm-overlay` so it hides when the tab flips to Setup) titled
  "Chat with agent" with one option per agent (escaped name, "N knowledge
  doc(s)", description). `.cm-agent-pop` / `.cm-agent-opt` give the
  two-line rows their own padding and clamp the description to two lines,
  since the single-line model row would crowd them. Anchored under the `.cm-side-mode` or
  `.cm-chip-mode` button for 'agent-chat' and kept 8 px inside the window, or
  centred near the top. Resolves the clicked agent, or null on an outside press
  or Escape; those listeners attach on the next tick so the opening click
  cannot dismiss it.
