const ArtifactId = require('../artifacts/ArtifactId');
const ArtifactTextEdit = require('../artifacts/ArtifactTextEdit');
const ArtifactValidation = require('../artifacts/ArtifactValidation');
const LiveModuleEdit = require('../artifacts/LiveModuleEdit');
const ChatToolHandler = require('./ChatToolHandler');

class EditArtifactHandler extends ChatToolHandler {
  static IMAGE_REFUSAL = 'edit_artifact does not support image artifacts; use edit_image instead.';
  static NO_EDIT = 'edit_artifact requires either "replacements" (array of {find, replace, replaceAll?}) for targeted edits, '
    + 'OR "content" (the complete revised document) for a full rewrite.';

  names() {
    return ['edit_artifact'];
  }

  async execute(_name, params, ctx) {
    try {
      const srcId = ArtifactId.from(params);
      const src = ctx.deps.artifactStore.get(srcId);
      if (!src) return { success: false, error: `edit_artifact: artifact "${srcId}" not found.` };
      if (src.type === 'image') return { success: false, error: EditArtifactHandler.IMAGE_REFUSAL };
      if (src.type === 'live') return await EditArtifactHandler._editLive(src, params, ctx);
      return await EditArtifactHandler._editText(src, srcId, params, ctx);
    } catch (err) {
      return { success: false, error: `edit_artifact failed: ${err.message}` };
    }
  }

  static async _editLive(src, params, ctx) {
    const edited = LiveModuleEdit.apply(src, params);
    if (!edited.ok) return { success: false, error: edited.error };
    const { html, js, libs } = edited;
    const fatal = await ArtifactValidation.liveFatalError(js);
    if (fatal) return { success: false, error: fatal };
    const version = EditArtifactHandler._saveVersion(src, params, ctx, JSON.stringify({ html, js, libs }));
    ChatToolHandler.publish(ctx, { ...version, html, js, libs });
    const note = await ArtifactValidation.liveNote(js);
    return {
      success: true,
      artifact: version,
      message: `The interactive module "${version.title}" was updated (v${version.version}) and re-rendered inline. Briefly tell the user what changed; do NOT paste the code back.${note}`,
    };
  }

  static async _editText(src, srcId, params, ctx) {
    const replacements = params && Array.isArray(params.replacements) ? params.replacements : null;
    const fullContent = params && typeof params.content === 'string' ? params.content : null;
    let newContent;
    let appliedNote = '';
    if (replacements && replacements.length > 0) {
      const edited = ArtifactTextEdit.apply(src, replacements);
      if (!edited.ok) return { success: false, error: edited.error };
      newContent = edited.content;
      appliedNote = ArtifactTextEdit.fuzzyNote(edited.fuzzyUsed);
    } else if (fullContent != null && fullContent.length > 0) {
      newContent = fullContent;
    } else {
      return { success: false, error: EditArtifactHandler.NO_EDIT };
    }
    const version = EditArtifactHandler._saveVersion(src, params, ctx, newContent);
    ChatToolHandler.publish(ctx, version);
    const note = await ArtifactValidation.codeNote(version);
    const how = replacements ? `${replacements.length} targeted edit${replacements.length === 1 ? '' : 's'}` : 'full rewrite';
    return {
      success: true,
      artifact: version,
      message: `Revised artifact "${version.title}" → v${version.version} (from ${srcId}, ${how}) is now displayed in the side panel. Briefly tell the user.${appliedNote}${note}`,
    };
  }

  static _saveVersion(src, params, ctx, content) {
    return ctx.deps.artifactStore.createVersion({
      sourceId: src.id,
      conversationId: ctx.conversationId,
      messageId: ctx.assistantMessageId,
      title: (params && params.title && String(params.title).trim()) || src.title,
      content,
    });
  }
}

module.exports = EditArtifactHandler;
