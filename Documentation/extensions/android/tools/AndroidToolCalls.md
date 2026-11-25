# AndroidToolCalls

`extensions/android/tools/AndroidToolCalls.js`

Answers the `android_*` tool calls.

## Methods

- `handle(toolName, args)`: refused with `ACCESS_OFF` while "Let AI use Android devices" is off. Picks the named device when it is running, else the only one running, else says what to do. A screenshot is an image part plus a line about its coordinates; reading the screen is plain text lines. Replies are built with [ToolReply](ToolReply.md).
