# CharArtStudio

`core/llm-server/ui/js/chat-ext/fields/CharArtStudio.js`

The character-art studio: base face (generate or upload), Generate
variations (every core emotion in turn), and ref-conditioned derivatives that
pass the base (or, for outfits, the full body) as `refImages` with
`slot: 'edit'`, so an edit model keeps the identity. The first rendered outfit
becomes the character's `currentOutfit` / `currentOutfitDesc`.

## Methods

- `new CharArtStudio({ field, art, api, siblingModel, rootModel }).build()` returns `.cm-charart`.
