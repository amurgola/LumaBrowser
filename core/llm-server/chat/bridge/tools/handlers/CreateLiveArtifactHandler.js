const ArtifactValidation = require('../artifacts/ArtifactValidation');
const LiveHtmlUnwrapper = require('../artifacts/LiveHtmlUnwrapper');
const ChatToolHandler = require('./ChatToolHandler');

class CreateLiveArtifactHandler extends ChatToolHandler {
  static NO_CONTENT = 'create_live_artifact needs at least "html" or "js" (an HTML fragment + a JS body, NOT a single "content" string).';
  static DEFAULT_TITLE = 'Live module';

  names() {
    return ['create_live_artifact'];
  }

  async execute(_name, params, ctx) {
    try {
      const { html, js, libs } = CreateLiveArtifactHandler._spec(params);
      if (!html && !js) return { success: false, error: CreateLiveArtifactHandler.NO_CONTENT };
      const fatal = await ArtifactValidation.liveFatalError(js);
      if (fatal) return { success: false, error: fatal };
      const artifact = ctx.deps.artifactStore.create({
        conversationId: ctx.conversationId,
        messageId: ctx.assistantMessageId,
        title: (params && params.title) || CreateLiveArtifactHandler.DEFAULT_TITLE,
        type: 'live',
        content: JSON.stringify({ html, js, libs }),
      });
      ChatToolHandler.publish(ctx, { ...artifact, html, js, libs });
      const note = await ArtifactValidation.liveNote(js);
      return {
        success: true,
        artifact,
        message: `The interactive module "${artifact.title}" is now shown inline in the chat. It's DONE: briefly tell the user what it does and how to use it (plain prose, no tool call), then stop. Do NOT paste the code back and do NOT call create_live_artifact again for this module. If a change is needed later, use edit_artifact with artifactId "${artifact.id}" and the new "html"/"js".${note}`,
      };
    } catch (err) {
      return { success: false, error: `create_live_artifact failed: ${err.message}` };
    }
  }

  static _spec(params) {
    let html = (params && typeof params.html === 'string') ? params.html : '';
    let js = (params && typeof params.js === 'string') ? params.js : '';
    const libs = Array.isArray(params && params.libs) ? params.libs.map(String) : [];
    if (!html && !js && params && typeof params.content === 'string' && params.content.trim()) {
      const unwrapped = LiveHtmlUnwrapper.unwrap(params.content);
      html = unwrapped.html;
      if (unwrapped.js) js = unwrapped.js;
    }
    return { html, js, libs };
  }
}

module.exports = CreateLiveArtifactHandler;
