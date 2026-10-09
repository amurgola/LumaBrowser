# entry

`core/llm-server/ui/js/entry.js`

The LLM tab page's module entry (`<script type="module" src="js/entry.js">` in
`llm-tab.html`): `new LlmTabPage({ win: window, doc: document, api: window.llmDiagAPI }).start()`.
See [LlmTabPage](page/LlmTabPage.md) and [LLM tab renderer](../LlmTabUi.md).
