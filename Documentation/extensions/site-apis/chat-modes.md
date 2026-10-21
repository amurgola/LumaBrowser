# chat-modes

`extensions/site-apis/chat-modes.js`

Chat modes entry loaded by name from the manifest after `activate()`: a factory answering the
[SiteApiBuilderMode](builder/SiteApiBuilderMode.md) descriptor from the running instance (`main.js
builderDescriptor()`), or nothing while the extension is inactive.
