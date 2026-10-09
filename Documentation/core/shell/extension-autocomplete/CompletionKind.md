# CompletionKind

`core/shell/extension-autocomplete/CompletionKind.js`

Monaco `CompletionItemKind` numbers as static constants.

## Members

`TEXT` 1, `METHOD` 2, `FUNCTION` 3, `CLASS` 4, `VALUE` 5, `INTERFACE` 6,
`PROPERTY` 7, `FIELD` 8, `VARIABLE` 11, `KEYWORD` 14, `CONSTANT` 18,
`ENUM_MEMBER` 20, `FILE` 22, `UNIT` 25, `COLOR` 27.

## Why

The catalog is built in the main process, which does not load Monaco; these
values must match the monaco-editor enum so the renderer can pass items straight
to Monaco.
