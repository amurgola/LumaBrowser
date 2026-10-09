# FormFieldResolver

`core/browser/controller/FormFieldResolver.js`

Re-resolves every field of a failed REST form fill through the selector LLM.

## Methods

- `FormFieldResolver.resolve(llmFallbackService, tabId, fields)` returns `[{ selector, value }]`, one
  per field, in order. Each field is resolved with
  `llmFallbackService.resolveSelector(tabId, field.llmFallback || 'Form field for value "<value>"',
  'fill', field.selector || field.label)`; a field the LLM cannot resolve keeps its own `selector`.
