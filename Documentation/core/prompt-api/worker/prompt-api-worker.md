# prompt-api-worker.js

`core/prompt-api/worker/prompt-api-worker.js` (utility process entry script)

Entry script of the Prompt API utility process, forked by
[PromptApiService](../PromptApiService.md). It builds one
[ParentRequests](ParentRequests.md) over `process.parentPort` and calls
`localAIHandler.setPromptAPIHandler` from `electron/utility` at once: for each
calling page Electron gets a language model class from
[LocalLanguageModel](LocalLanguageModel.md)`.define(LanguageModelUtility, { requests, page })`,
with `page` `{ webContentsId, origin }` (the handler details' `webContentsId` and
`securityOrigin`), so the main process can ask the user about that site in that
tab. Because the handler is set as soon as the script runs, a page that prompts
while the process starts is queued, not refused.
