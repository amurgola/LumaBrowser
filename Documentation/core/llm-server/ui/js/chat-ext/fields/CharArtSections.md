# CharArtSections

`core/llm-server/ui/js/chat-ext/fields/CharArtSections.js`

The studio's gated sections: Emotions (after a base face; core derivatives
plus custom emotions with "+ Add emotion"), Full Body (after every core
emotion), Outfits (after the full body; stored on the sibling model's
`outfits`, "+ Add outfit").

## Methods

- `new CharArtSections({ art, field, siblingModel, onGenerate })`; `draw()`;
  `coreEmotions`; `coreCell(index)`; `root`.
