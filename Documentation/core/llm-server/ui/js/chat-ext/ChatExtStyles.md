# ChatExtStyles

`core/llm-server/ui/js/chat-ext/ChatExtStyles.js`

The schema-form styles the component library does not cover (field groups,
repeaters, image field, character-art studio, the AI-fill box), injected once
as `<style id="cm-ext-styles">`. Kept in JS rather than a CSS file because
add-on bundles and the PWA use the forms without linking a stylesheet.

## Methods

- `ChatExtStyles.ensure(doc?)`; `ChatExtStyles.CSS`. Rules use design tokens only
  (see `Documentation/ui/DesignSystem.md`): groups and repeaters are hairline
  separated sections, the only animation is the AI-fill icon fading while an
  assist builds its prompt (off under reduced motion), and a streaming AI-fill
  box holds an accent border instead of a moving shimmer.
