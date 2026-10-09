# SchemaFieldRenderer

`core/llm-server/ui/js/chat-ext/SchemaFieldRenderer.js`

Renders one schema field into a `.luma-field` wrapper: label row and hint,
the field type's controls, then the AI-fill box on text fields with `assist`.

## Methods

- `new SchemaFieldRenderer(fieldClasses = FIELD_CLASSES)` maps each class's
  `types` to one instance.
- `render(field, model, api, siblingModel, rootModel?)` returns the wrapper.
  `half` adds `cm-x-half`; toggle and button draw their own layout (no label
  row); an unknown type renders the label row only. The label and hint are
  inserted as HTML (schema-authored).
- Field types: [ToggleField](fields/ToggleField.md), [ButtonField](fields/ButtonField.md),
  [TextInputField](fields/TextInputField.md), [TextareaField](fields/TextareaField.md),
  [SelectField](fields/SelectField.md), [GroupField](fields/GroupField.md),
  [ImageField](fields/ImageField.md), [CharArtField](fields/CharArtField.md),
  [RepeaterField](fields/RepeaterField.md), all extending [SchemaField](fields/SchemaField.md).
