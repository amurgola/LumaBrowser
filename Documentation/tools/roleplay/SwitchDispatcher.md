# SwitchDispatcher

`tools/roleplay/SwitchDispatcher.js`

A model dispatcher that answers from a script until `goLive()` hands
everything to a real one. Same surface as the router's `ModelDispatcher`
(`dispatch(...)`, `observe(fn)`); observers see every request whichever side
answers it. `calls` records each dispatch with whether it went live.
