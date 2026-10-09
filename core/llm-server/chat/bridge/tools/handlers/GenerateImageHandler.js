const MediaRenderOutcome = require('../media/MediaRenderOutcome');
const MediaProgressSink = require('../media/MediaProgressSink');
const MediaTitle = require('../media/MediaTitle');
const BridgeGlobals = require('../../BridgeGlobals');
const ChatToolHandler = require('./ChatToolHandler');

class GenerateImageHandler extends ChatToolHandler {
  static NO_SERVER = 'Image server not initialised on this build.';

  names() {
    return ['generate_image'];
  }

  async execute(_name, params, ctx) {
    const router = BridgeGlobals.imageRouter();
    if (!router) return { success: false, error: GenerateImageHandler.NO_SERVER };
    const prompt = params && typeof params.prompt === 'string' ? params.prompt.trim() : '';
    if (!prompt) return { success: false, error: 'generate_image requires a non-empty "prompt".' };
    const sink = new MediaProgressSink({ tool: 'generate_image', hooks: ctx.hooks, isAborted: ctx.isAborted });
    let result;
    try {
      result = await router.generate({ prompt, send: sink.send });
    } catch (err) {
      return { success: false, error: `generate_image failed: ${err.message}` };
    }
    const failure = MediaRenderOutcome.failureOf(result, sink, ctx.isAborted, 'generate_image', MediaRenderOutcome.images('generate_image'));
    if (failure) return failure;
    return GenerateImageHandler._persist(result.images[0], MediaTitle.from(params, prompt), ctx);
  }

  static _persist(img, title, ctx) {
    let artifact;
    try {
      artifact = ctx.deps.artifactStore.create({
        conversationId: ctx.conversationId,
        messageId: ctx.assistantMessageId,
        title,
        type: 'image',
        bytes: img.bytes,
        mime: img.mime || 'image/png',
      });
    } catch (err) {
      return { success: false, error: `Could not persist image artifact: ${err.message}` };
    }
    ChatToolHandler.publish(ctx, artifact);
    return {
      success: true,
      artifact,
      message: `Image "${artifact.title}" is now displayed in the side panel next to the chat. Briefly tell the user; do not paste the prompt back.`,
    };
  }
}

module.exports = GenerateImageHandler;
