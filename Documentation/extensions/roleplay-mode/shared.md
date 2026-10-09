# shared.js (classic, page copy)

`extensions/roleplay-mode/shared.js`

The chat page's copy of the shared roleplay logic, published as
`window.RP_SHARED` for [chat-ui](chat-ui.md) and served from
`/llm-ui/ext/roleplay-mode/shared.js` (declared in `chatUi.assets`).
Classic-script exception (distributable extension). The main process uses the
`world/` classes instead; the CommonJS branch of the wrapper exists only so
the parity test can also require it.

## Exports

| `RP_SHARED` | Main-process twin |
|---|---|
| `RP_DATA_VERSION` | [DataMigration](world/DataMigration.md)`.VERSION` |
| `SETUP_ART` | [SetupArt](world/SetupArt.md)`.PROMPTS` |
| `activeScene(data)` | [SceneLocator](world/SceneLocator.md)`.active` |
| `currentStateEntries(data)` | [CastResolver](world/CastResolver.md)`.currentEntries` |
| `charactersForCurrentMoment(data, content)` | `CastResolver.forMoment` |
| `normOutfit(s)` | [OutfitText](world/OutfitText.md)`.normalize` |
| `characterBodyRef(c)` | [CharacterArt](world/CharacterArt.md)`.bodyRef` |
| `characterBodyRefForState(c, state)` | `CharacterArt.bodyRefForState` |
| `migrateData(data)` | `DataMigration.migrate` |

## Globals

Writes `window.RP_SHARED` (via `self`).
