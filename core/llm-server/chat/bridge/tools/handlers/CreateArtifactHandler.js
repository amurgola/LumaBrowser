const ArtifactValidation = require('../artifacts/ArtifactValidation');
const ChatToolHandler = require('./ChatToolHandler');

class CreateArtifactHandler extends ChatToolHandler {
  names() {
    return ['create_artifact'];
  }

  async execute(_name, params, ctx) {
    try {
      const artifact = ctx.deps.artifactStore.create({
        conversationId: ctx.conversationId,
        messageId: ctx.assistantMessageId,
        title: params && params.title,
        type: params && params.type,
        language: params && params.language,
        content: params && params.content,
      });
      ChatToolHandler.publish(ctx, artifact);
      const note = await ArtifactValidation.codeNote(artifact);
      return {
        success: true,
        artifact,
        message: `Artifact "${artifact.title}" is now displayed in the side panel next to the chat. Briefly tell the user; do not paste the content back.${note}`,
      };
    } catch (err) {
      return { success: false, error: `create_artifact failed: ${err.message}` };
    }
  }
}

module.exports = CreateArtifactHandler;
