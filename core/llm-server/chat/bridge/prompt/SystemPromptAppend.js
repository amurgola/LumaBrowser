const ToolGroups = require('../../ToolGroups');
const ToolSchemas = require('../../ToolSchemas');
const AvailableGroups = require('../groups/AvailableGroups');

class SystemPromptAppend {
  static TAKEOVER_DOC = 'ask_user_takeover: call this when the working tab is blocked by something '
    + 'only the user can do: a login wall, captcha, 2FA prompt, or an age/consent gate. '
    + 'Params: {"reason": "one short sentence telling the user exactly what to do in the tab"}. '
    + 'The run PAUSES until the user acts (or a few minutes pass); the result says whether they '
    + 'finished or skipped. Never invent credentials or type into password fields yourself.';

  static DATE_FORMAT = {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  };

  static build({
    allows, extTools, groups = null, visionHint = null, modeSystemPrompt = null, activeGroups = null,
    imagePromptHint = null, takeover = false, nativeTools = false, nativeExclude = [], now = new Date(),
  }) {
    const active = activeGroups instanceof Set ? activeGroups : new Set(activeGroups || []);
    const available = groups || AvailableGroups.for(allows, extTools);
    const registry = ToolGroups.buildInactiveRegistry(available.filter((g) => !active.has(g.key)));
    return [
      SystemPromptAppend.dateTimeDoc(now),
      ...SystemPromptAppend._activeDocs(available, active, nativeTools, imagePromptHint),
      SystemPromptAppend._fenceFallback(available, active, allows, nativeTools, nativeExclude),
      registry || null,
      takeover ? SystemPromptAppend.TAKEOVER_DOC : null,
      visionHint,
      modeSystemPrompt,
    ].filter(Boolean).join('\n\n');
  }

  static dateTimeDoc(now) {
    return 'Current date and time (the user\'s local system clock): '
      + now.toLocaleString(undefined, SystemPromptAppend.DATE_FORMAT)
      + '. Treat this as the authoritative "now" for anything time-relative '
      + '(today, current time, dates, deadlines, "how long ago").';
  }

  static _activeDocs(groups, active, nativeTools, imagePromptHint) {
    return groups.filter((g) => active.has(g.key)).map((g) => {
      const doc = nativeTools ? ToolGroups.docWithoutFenceExamples(g.doc) : g.doc;
      return (g.key === 'images' && imagePromptHint) ? `${doc}\n\n${imagePromptHint}` : doc;
    });
  }

  static _fenceFallback(groups, active, allows, nativeTools, nativeExclude) {
    if (!nativeTools) return null;
    const visible = (nativeExclude || []).filter((name) => allows(name)
      && groups.some((g) => active.has(g.key) && g.tools && g.tools.includes(name)));
    return visible.length ? ToolSchemas.fenceFallbackDoc(visible) : null;
  }
}

module.exports = SystemPromptAppend;
