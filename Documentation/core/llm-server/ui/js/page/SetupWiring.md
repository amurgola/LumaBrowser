# SetupWiring

`core/llm-server/ui/js/page/SetupWiring.js`

Builds the LLM tab's Setup side for [LlmTabPage](LlmTabPage.md): the
[SetupMain](../setup-ui/SetupMain.md) panel with its model list, model search
and the lazy Image and Music panels, plus the visual grounding card and the
Easy Setup launch button.

## Methods

- `new SetupWiring({ api, chatExt?, doc?, win? })`.
- `build()` returns this. Builds [ImageSetupPanel](../image-setup/ImageSetupPanel.md)
  (`modelList: ModelList`), [MusicSetupPanel](../music-setup/MusicSetupPanel.md)
  (`getChatExt` returns the page's LumaChatExt), [ModelSearch](../models/ModelSearch.md),
  [GroundingSetupCard](../grounding-setup/GroundingSetupCard.md),
  [EasySetupWizard](../wizard/EasySetupWizard.md), and SetupMain with
  `modelList: ModelList`, `modelSearch`, and
  `openers: { image: () => imageSetup.open(), music: () => musicSetup.open() }`.
  Every panel's `getApi` returns the page's `api`.
- `start()`: `setupMain.start()` (not awaited, as legacy's top-level `load()`),
  `musicSetup.hideNavIfUnsupported()`, `grounding.start()`, `wizard.install()`.
- `navigator`: SetupMain's [SetupNavigator](../setup-ui/nav/SetupNavigator.md)
  (legacy `window.LumaSetupNav`).
- Fields: `setupMain`, `imageSetup`, `musicSetup`, `modelSearch`, `grounding`, `wizard`.
