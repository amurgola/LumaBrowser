# DemoScene

`tools/docs/readme-shots/DemoScene.js`

The README's animated demo, played live while [DemoClip](DemoClip.md) records the window. It shows the two things
the README leads with, in order: the model search with its fit verdict ([ModelFitScene](ModelFitScene.md)), then one
question typed into the chat composer and answered on the local model with web search.

Unlike [ChatScene](ChatScene.md), which runs its turn through `llmDiagAPI.chat2` and opens the finished
conversation, this scene types into `.cm-composer textarea` and presses Enter, so the recording shows the typing,
the tool steps and the reply streaming in. The turn is over when the Send button stops being Stop
(`.cm-send.cm-stop`).

Steps: size the window to 980x640 CSS px (a README column is 600 to 850 px wide, and a clip recorded in a much
wider window is unreadable once GitHub scales it down), reload the LLM tab so the chat is on its landing whatever
ran before (the page comes back on the side of the Setup/Chat toggle it was left on, so Chat is asked for), fold
the chat sidebar, show Setup, scrub the machine name ([PageSanitizer](PageSanitizer.md)), start recording the
window by its handle, play the fit search, switch to Chat, ask, stop recording, render. The GIF goes to the path given; the MP4 goes to the temp dir as
`lumabrowser-demo.mp4` and its path is logged.

## Methods

- `static record(app, page, { query, quant, prompt, timeoutMs, maxSeconds, gifPath, log })`: the scene; returns
  `{ seconds, speed, gifPath, mp4Path }`.
- `_freshLanding(page)`, `_foldSidebar(page)`, `_ask(page, prompt, timeoutMs, log)`, `_hwnd(app)`: the steps
  above.
