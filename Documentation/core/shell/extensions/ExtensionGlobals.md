# ExtensionGlobals

`core/shell/extensions/ExtensionGlobals.js`

Lazy readers for the singletons main.js parks on `global`, so extension
activation order relative to the servers never matters.

## Methods

- `ExtensionGlobals.imageRouter()` `global.__lumaImageRouter`.
- `ExtensionGlobals.imageServerService()` `global.__lumaImageServerService`.
- `ExtensionGlobals.llmServerService()` `global.__lumaLlmServerService`.
- `ExtensionGlobals.chatRouter()` `global.__lumaChatRouter`.

Each returns null when unset.
