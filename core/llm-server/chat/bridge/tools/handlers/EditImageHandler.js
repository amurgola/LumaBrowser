const ImageDimensions = require('../../../../../shared/content/ImageDimensions');
const EditProfiles = require('../../../../../image-server/prompt/EditProfiles');
const ArtifactId = require('../artifacts/ArtifactId');
const EditCanvas = require('../media/EditCanvas');
const EditModelChoice = require('../media/EditModelChoice');
const EditReferences = require('../media/EditReferences');
const MediaRenderOutcome = require('../media/MediaRenderOutcome');
const MediaProgressSink = require('../media/MediaProgressSink');
const MediaTitle = require('../media/MediaTitle');
const BridgeGlobals = require('../../BridgeGlobals');
const ChatToolHandler = require('./ChatToolHandler');

class EditImageHandler extends ChatToolHandler {
  static NO_SERVER = 'Image server not initialised on this build.';
  static NO_ARTIFACT = 'edit_image requires "artifactId": pass the id of a previously generated image artifact.';
  static DEFAULT_STRENGTH = 0.8;

  names() {
    return ['edit_image'];
  }

  async execute(_name, params, ctx) {
    const router = BridgeGlobals.imageRouter();
    if (!router) return { success: false, error: EditImageHandler.NO_SERVER };
    const prompt = params && typeof params.prompt === 'string' ? params.prompt.trim() : '';
    if (!prompt) return { success: false, error: 'edit_image requires a non-empty "prompt".' };
    const artifactId = ArtifactId.from(params);
    if (!artifactId) return { success: false, error: EditImageHandler.NO_ARTIFACT };
    const src = ctx.deps.artifactStore.get(artifactId);
    const srcProblem = EditImageHandler._sourceProblem(artifactId, src);
    if (srcProblem) return { success: false, error: srcProblem };
    const plan = await EditImageHandler._plan({ router, params, prompt, artifactId, src, ctx });
    if (plan.error) return { success: false, error: plan.error };
    return EditImageHandler._render(router, plan, ctx);
  }

  static _sourceProblem(artifactId, src) {
    if (!src) return `edit_image: artifact "${artifactId}" not found.`;
    if ((src.type || '') !== 'image') return `edit_image: artifact "${artifactId}" is a ${src.type}, not an image.`;
    if (!src.content) return `edit_image: artifact "${artifactId}" has no image bytes.`;
    return null;
  }

  static async _plan({ router, params, prompt, artifactId, src, ctx }) {
    const choice = await EditModelChoice.resolve(router);
    const references = EditReferences.resolve({ params, artifactStore: ctx.deps.artifactStore, sourceId: artifactId, max: choice.maxReferences });
    if (references.error) return { error: references.error };
    const srcBuf = Buffer.from(src.content, 'base64');
    const frame = EditCanvas.requestedFrame(params);
    const canvas = await EditCanvas.resolve({ frame, srcDims: ImageDimensions.read(srcBuf), choice, imageRouter: router });
    const extraRefs = choice.editCapable ? references.refs : [];
    return {
      choice, references, canvas, frame, extraRefs, artifactId, srcBuf,
      prompt,
      strength: EditImageHandler._strength(params),
      title: MediaTitle.from(params, prompt),
      frameIgnored: !choice.editCapable && frame !== EditCanvas.DEFAULT_FRAME,
      refsIgnored: !choice.editCapable && references.refs.length > 0,
      refImages: [src.content, ...extraRefs.map((r) => r.content)],
    };
  }

  static async _render(router, plan, ctx) {
    const sink = new MediaProgressSink({ tool: 'edit_image', hooks: ctx.hooks, isAborted: ctx.isAborted });
    let result;
    try {
      result = await router.generate(EditImageHandler._request(plan, sink.send));
    } catch (err) {
      return { success: false, error: `edit_image failed: ${err.message}` };
    }
    const failure = MediaRenderOutcome.failureOf(result, sink, ctx.isAborted, 'edit_image', MediaRenderOutcome.images('edit_image'));
    if (failure) return failure;
    return EditImageHandler._persist(result.images[0], plan, ctx);
  }

  static _request(plan, send) {
    const { choice, canvas, refImages } = plan;
    const size = { width: canvas.width, height: canvas.height };
    const editPrompt = EditImageHandler._editPrompt(plan);
    if (choice.remoteEdit) return { prompt: editPrompt, refImages, ...size, slot: 'edit', send };
    if (choice.editModelId) return { prompt: editPrompt, modelRef: choice.editModelId, refImages, ...size, slot: 'edit', send };
    if (choice.unifiedGenEdit) return { prompt: editPrompt, refImages, ...size, slot: 'generate', send };
    return { prompt: plan.prompt, initImage: plan.srcBuf, strength: plan.strength, ...size, slot: 'generate', send };
  }

  static _editPrompt({ extraRefs, choice, prompt }) {
    if (!extraRefs.length) return prompt;
    const profile = choice.profile;
    return `${EditProfiles.referencePreamble(extraRefs, profile ? profile.refTag : 'word')} ${prompt}`;
  }

  static _strength(params) {
    const requested = params && Number(params.strength);
    return (Number.isFinite(requested) && requested >= 0 && requested <= 1) ? requested : EditImageHandler.DEFAULT_STRENGTH;
  }

  static _persist(img, plan, ctx) {
    let artifact;
    try {
      artifact = ctx.deps.artifactStore.createVersion({
        sourceId: plan.artifactId,
        conversationId: ctx.conversationId,
        messageId: ctx.assistantMessageId,
        title: plan.title,
        bytes: img.bytes,
        mime: img.mime || 'image/png',
      });
    } catch (err) {
      return { success: false, error: `Could not persist edited image: ${err.message}` };
    }
    ChatToolHandler.publish(ctx, artifact);
    return { success: true, artifact, message: EditImageHandler._message(artifact, plan) };
  }

  static _message(artifact, plan) {
    const { choice, canvas, frame, extraRefs, references, strength } = plan;
    const n = extraRefs.length;
    return `Edited image "${artifact.title}" saved as v${artifact.version} id ${artifact.id} (from ${plan.artifactId}, which is kept unchanged as the earlier version${choice.editCapable ? '' : `; strength ${strength}`}`
      + `, ${canvas.width}x${canvas.height} ${canvas.frame} frame${canvas.scaled ? ', source scaled into the model\'s working size' : ''}`
      + `${plan.frameIgnored ? `; "${frame}" frame IGNORED because no edit-capable model is configured, the img2img fallback keeps the source shape` : ''}`
      + `${n ? `; used ${n} reference image${n === 1 ? '' : 's'} (${extraRefs.map((r, i) => `image ${i + 2} = ${r.id}${r.use ? ` ${r.use}` : ''}`).join(', ')})` : ''}`
      + `${references.dropped ? `; ${references.dropped} extra reference${references.dropped === 1 ? '' : 's'} DROPPED, at most ${choice.maxReferences} are used` : ''}`
      + `${plan.refsIgnored ? '; references IGNORED because no edit-capable model is configured, the img2img fallback only sees the source image' : ''}`
      + ') is now displayed in the side panel. Briefly tell the user.';
  }
}

module.exports = EditImageHandler;
