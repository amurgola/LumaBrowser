const ArtifactId = require('../artifacts/ArtifactId');
const MediaProgressSink = require('../media/MediaProgressSink');
const MediaRenderOutcome = require('../media/MediaRenderOutcome');
const MediaTitle = require('../media/MediaTitle');
const BridgeGlobals = require('../../BridgeGlobals');
const ChatToolHandler = require('./ChatToolHandler');

class VideoHandler extends ChatToolHandler {
  static NO_SERVER = 'Video server not initialised on this build.';
  static NO_ARTIFACT = 'animate_image requires "artifactId": pass the id of a previously generated image artifact to animate.';

  names() {
    return ['generate_video', 'animate_image'];
  }

  async execute(tool, params, ctx) {
    const router = BridgeGlobals.videoRouter();
    if (!router) return { success: false, error: VideoHandler.NO_SERVER };
    const prompt = params && typeof params.prompt === 'string' ? params.prompt.trim() : '';
    if (!prompt) return { success: false, error: `${tool} requires a non-empty "prompt".` };
    const frames = tool === 'animate_image' ? VideoHandler._frames(params, ctx.deps.artifactStore) : { firstFrame: null, lastFrame: null };
    if (frames.error) return { success: false, error: frames.error };
    const sink = new MediaProgressSink({ tool, hooks: ctx.hooks, isAborted: ctx.isAborted });
    let result;
    try {
      result = await router.generate({ prompt, ...frames, durationSec: VideoHandler._duration(params), send: sink.send });
    } catch (err) {
      return { success: false, error: `${tool} failed: ${err.message}` };
    }
    const failure = MediaRenderOutcome.failureOf(result, sink, ctx.isAborted, tool, MediaRenderOutcome.video(tool));
    if (failure) return failure;
    return VideoHandler._persist(result.video, MediaTitle.from(params, prompt), ctx);
  }

  static _frames(params, artifactStore) {
    const artifactId = ArtifactId.from(params);
    if (!artifactId) return { error: VideoHandler.NO_ARTIFACT };
    const src = artifactStore.get(artifactId);
    if (!src) return { error: `animate_image: artifact "${artifactId}" not found.` };
    if ((src.type || '') !== 'image') return { error: `animate_image: artifact "${artifactId}" is a ${src.type}, not an image.` };
    if (!src.content) return { error: `animate_image: artifact "${artifactId}" has no image bytes.` };
    const endId = params && (params.endArtifactId || params.lastArtifactId);
    const end = endId ? artifactStore.get(endId) : null;
    const lastFrame = (end && (end.type || '') === 'image' && end.content) ? Buffer.from(end.content, 'base64') : null;
    return { firstFrame: Buffer.from(src.content, 'base64'), lastFrame };
  }

  static _duration(params) {
    return params && Number(params.durationSec) > 0 ? Number(params.durationSec) : null;
  }

  static _persist(video, title, ctx) {
    let artifact;
    try {
      artifact = ctx.deps.artifactStore.create({
        conversationId: ctx.conversationId,
        messageId: ctx.assistantMessageId,
        title,
        type: 'video',
        bytes: video.bytes,
        mime: video.mime || 'video/webm',
      });
    } catch (err) {
      return { success: false, error: `Could not persist video artifact: ${err.message}` };
    }
    ChatToolHandler.publish(ctx, artifact);
    return {
      success: true,
      artifact,
      message: `Video "${artifact.title}" is now displayed in the side panel next to the chat. Briefly tell the user; do not paste the prompt back.`,
    };
  }
}

module.exports = VideoHandler;
