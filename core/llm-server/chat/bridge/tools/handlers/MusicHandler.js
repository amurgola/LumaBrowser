const MediaProgressSink = require('../media/MediaProgressSink');
const MediaRenderOutcome = require('../media/MediaRenderOutcome');
const BridgeGlobals = require('../../BridgeGlobals');
const ChatToolHandler = require('./ChatToolHandler');

class MusicHandler extends ChatToolHandler {
  static NO_SERVER = 'Music server not initialised on this build.';
  static DEFAULT_TITLE = 'Generated song';
  static TITLE_CHARS = 60;

  names() {
    return ['generate_music'];
  }

  async execute(_name, params, ctx) {
    const router = BridgeGlobals.musicRouter();
    if (!router) return { success: false, error: MusicHandler.NO_SERVER };
    const lyrics = params && typeof params.lyrics === 'string' ? params.lyrics.trim() : '';
    const style = params && typeof params.style_description === 'string' ? params.style_description.trim() : '';
    if (!lyrics) return { success: false, error: 'generate_music requires non-empty "lyrics".' };
    if (!style) return { success: false, error: 'generate_music requires a non-empty "style_description".' };
    const sink = new MediaProgressSink({ tool: 'generate_music', hooks: ctx.hooks, isAborted: ctx.isAborted, progress: 'elapsed' });
    let result;
    try {
      result = await router.generate({ lyrics, instructions: style, ...MusicHandler._options(params), send: sink.send });
    } catch (err) {
      return { success: false, error: `generate_music failed: ${err.message}` };
    }
    const failure = MediaRenderOutcome.failureOf(result, sink, ctx.isAborted, 'generate_music', MediaRenderOutcome.audio('generate_music'));
    if (failure) return failure;
    return MusicHandler._persist(result.audio, MusicHandler._title(params, lyrics), ctx);
  }

  static firstLyricLine(lyrics) {
    for (const raw of String(lyrics).split(/\r?\n/)) {
      const line = raw.trim();
      if (line && !/^\[[^\]]+\]$/.test(line)) return line.slice(0, MusicHandler.TITLE_CHARS);
    }
    return null;
  }

  static _options(params) {
    return {
      durationSec: params && Number(params.durationSec) > 0 ? Number(params.durationSec) : null,
      seed: params && Number.isFinite(Number(params.seed)) ? Number(params.seed) : undefined,
    };
  }

  static _title(params, lyrics) {
    return (params && params.title && String(params.title).trim()) || MusicHandler.firstLyricLine(lyrics) || MusicHandler.DEFAULT_TITLE;
  }

  static _persist(audio, title, ctx) {
    let artifact;
    try {
      artifact = ctx.deps.artifactStore.create({
        conversationId: ctx.conversationId,
        messageId: ctx.assistantMessageId,
        title,
        type: 'audio',
        bytes: Buffer.from(audio.b64, 'base64'),
        mime: audio.mime || 'audio/wav',
      });
    } catch (err) {
      return { success: false, error: `Could not persist audio artifact: ${err.message}` };
    }
    ChatToolHandler.publish(ctx, artifact);
    const dur = audio.durationSec ? ` (${Math.round(audio.durationSec)}s)` : '';
    return {
      success: true,
      artifact,
      message: `Song "${artifact.title}"${dur} is now playable in the side panel next to the chat. Briefly tell the user; do not paste the lyrics back.`,
    };
  }
}

module.exports = MusicHandler;
