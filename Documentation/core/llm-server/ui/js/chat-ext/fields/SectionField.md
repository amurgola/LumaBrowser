# SectionField

`core/llm-server/ui/js/chat-ext/fields/SectionField.js`

`type: 'section'`: a titled, collapsible run of sub-fields that write into the
SAME model as their siblings (a group nests under its key; a section does not).
The wrapper becomes `.cm-xsection` (plus `is-collapsed` when `field.collapsed`)
with a `.cm-xsection-title` button (caret, `aria-expanded`), the hint, and a
`.cm-xsection-body` holding the sub-fields.

## Methods

- `render(wrap, spec)` recurses through `spec.renderer` with the same model;
  clicking the title toggles `is-collapsed`.

## Why

A setup form can keep its advanced keys where the data expects them while
hiding them behind "More" (the roleplay setup's models, art, cast, scenes and
options).
