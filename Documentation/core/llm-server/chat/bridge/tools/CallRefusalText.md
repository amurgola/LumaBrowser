# CallRefusalText

`core/llm-server/chat/bridge/tools/CallRefusalText.js`

Model-facing texts for calls refused or flagged because of how they arrived.

## Methods (all static)

- `argumentsUnreadable(name, raw)`: the arguments were not valid JSON, nothing
  ran, write backslashes doubled; quotes what was received.
- `argumentsCutOff(name)`: the token limit cut the call before its arguments;
  re-issue briefly or split the work.
- `refusedTruncatedCall(name)`: a mutating call was cut mid-generation;
  nothing was written; re-send in smaller pieces.
- `withTruncationWarning(res)`: a successful result gets `truncatedArgs: true`
  and `TRUNCATION_WARNING` appended to (or as) its message; failures and
  nullish results pass unchanged.
- `MALFORMED_CALL`, `TRUNCATION_WARNING`.
