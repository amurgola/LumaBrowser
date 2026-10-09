# ImageModelDisplayNames

`core/image-server/service/ImageModelDisplayNames.js`

The user's display-name overrides for image models and the name a model shows
under. Extends `SettingsValueStore` (runs `SettingsValueStoreContract`); key
`core.imageServer.modelDisplayNames`.

## Methods

- `new ImageModelDisplayNames(settingsDb)`.
- `all()` a copy of every override `{ key: name }`.
- `set(key, name)` trims; a blank name removes the override; a missing key
  changes nothing. Returns every override.
- `resolve(stem)` `ImageModelName.resolveDisplayName({ stem, overrides })`: the
  override, else the catalog label, else the prettified stem.

A stored value that is not a plain object (including an array) reads as empty.
