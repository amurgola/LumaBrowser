# PendingTestConfig

`extensions/tool-forge/PendingTestConfig.js`

Remembers the config overrides a passing test used, keyed to the code that
passed, so publish can save them. In memory only; never written into the tool
record.

## Methods

- `remember(tool, codeHash, overrides)`: keeps non-empty values for the tool's
  declared slot keys, as strings; with none left, drops any earlier entry.
- `take(toolName, codeHash)`: the values when the hash matches, else null;
  the entry is consumed either way.
