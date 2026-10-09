# LlmSetupFlow

`core/llm-server/ui/js/wizard/LlmSetupFlow.js`

The guided "Download & set up": [LlmSetup](../setup/LlmSetup.md) with the recommendation, the search override and the pasted URL, Pause and Cancel, then "Local AI is ready" with Continue to image generation or Skip.

## Methods

- `new LlmSetupFlow(wizard).run(body)`.

## Globals

None.

## Notes

Bug fixed: Resume re-ran setup after the card (and its paste field) was gone, which reset the pasted URL to empty and silently switched the download to the recommendation. The previous value is kept (test "Resume after a pause keeps a pasted URL").
