const RdFlowAssets = require('../assets/RdFlowAssets');

class GameAssetRules {
  static render({ imageReady = false, artStyle = null, alpha = false, models = null, palette = null } = {}) {
    return `<assets>
generate_asset / generate_assets create image files under assets/: each writes a correctly-sized
solid-colour placeholder immediately (so the game loads and lays out right away). ${GameAssetRules._timing(imageReady)}
Rules:
- When a build step needs MORE THAN ONE asset (hero + enemies + backdrop), make ONE
  generate_assets call with the whole array; never a string of generate_asset calls. The batch
  renders back-to-back on a single image-model load.
${GameAssetRules._alphaLine(alpha)}
- Ask for concrete, single-subject prompts ("red spaceship seen from above").
${GameAssetRules._styleLine(artStyle)}
- Small assets (under 256px) are generated LARGE (at the image model's native resolution) and
  machine-downscaled to your requested size, down to a real 16x16 tile (pixel-art additionally
  gets a palette snap); request the SIZE the game actually uses (e.g. 32x32); load pixel-art
  1:1 with pixelArt: true in the game config.
- Pixel-art above 256px is drawn on a LOGICAL grid and scaled up with hard pixels (a 512x512
  backdrop = 256x256 grid at 2x). Pass pixelSize (file pixels per logical pixel) to keep sprites
  and backdrops equally chunky: 64x64 sprites shown at 4x zoom pair with a backdrop at pixelSize 4.
- Never embed base64 image data in JS or HTML; always generate_asset + a relative path.${GameAssetRules._modelLine(models)}${GameAssetRules._rdFlowLine(models)}${GameAssetRules._paletteLine(palette)}
- Sound: procedural WebAudio only (oscillators/noise in src/systems/audio.js). No audio files.
</assets>`;
  }

  static _timing(imageReady) {
    if (imageReady) {
      return 'The real image renders right after your reply ends and replaces the placeholder by itself: keep '
        + 'building, never wait for it or request it twice, and say in your reply that the art is still on its way.';
    }
    return 'This machine has NO image generation configured, so placeholders are what ships; lean on '
      + 'shapes, colour, and text so the game still looks intentional.';
  }

  static _styleLine(artStyle) {
    if (!artStyle) return '- Pick a style (pixel-art / cartoon / painted / flat) and use it consistently across the game.';
    return `- The user chose the "${artStyle}" art style at setup; it is the default for every asset; `
      + 'stay consistent with it (only override style per-call with good reason).';
  }

  static _alphaLine(alpha) {
    if (alpha) {
      return '- SPRITES: pass transparent: true; the background is removed automatically, so describe ONE\n'
        + '  subject and nothing behind it. BACKDROPS: leave transparent off and size them to the full\n'
        + '  game resolution. If a result reports the background could not be keyed, it shipped opaque.';
    }
    return '- Images are OPAQUE (no transparency). Design sprites to read on any background; make backdrops\n'
      + '  full-canvas assets sized to the game resolution.';
  }

  static _rdFlowLine(models) {
    const pins = models || {};
    if (!RdFlowAssets.isModel(pins.sprite) && !RdFlowAssets.isModel(pins.backdrop)) return '';
    return '\n- Pixel-art sprites render on RD Flow 64: it draws 64x64 pixel art with exact palette colours and real '
      + 'transparency, so keep pixel-art sprites square-ish at 64x64 or smaller (or 128/192/256 for whole-pixel zoom). '
      + 'Write EACH such sprite\'s prompt as ONE plain caption of 120-200 words, in order: what it is; its parts top '
      + 'to bottom with colours, shapes and positions; pose and facing; the view (front, side, three-quarter, '
      + 'top-down) with the subject centred and filling most of the frame; outline colour, shading and light '
      + 'direction. Describe only that subject (no extra props or scenery), never write "pixel art", "sprite" or '
      + 'sizes, and use no text or lettering.';
  }

  static _paletteLine(palette) {
    if (!Array.isArray(palette) || !palette.length) return '';
    const shown = palette.slice(0, 32).join(' ');
    return `\n- The game has a locked palette of ${palette.length} colours (${shown}${palette.length > 32 ? ' ...' : ''}): `
      + 'every pixel-art asset is drawn in or snapped to it, so describe colours it contains.';
  }

  static _modelLine(models) {
    const pins = models || {};
    if (!pins.sprite || !pins.backdrop || pins.sprite === pins.backdrop) return '';
    return `\n- Sprites (transparent, or under 256px) render on ${pins.sprite}; backdrops and tiles at 256px+ on ${pins.backdrop}. `
      + 'Size each asset for what it IS so it lands on the right model; batch sprites and backdrops together in one generate_assets call.';
  }
}

module.exports = GameAssetRules;
