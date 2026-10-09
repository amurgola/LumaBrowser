const TriggerGatingParams = require('./TriggerGatingParams');

class TriggerUpdatePatch {
  static build(trigger, params, services) {
    const patch = { origin: 'chat' };
    if (params.title != null) patch.title = params.title;
    const action = TriggerUpdatePatch._action(params, services);
    if (action.error) return action;
    if (Object.keys(action.action).length) patch.action = action.action;
    const kindSource = TriggerUpdatePatch._kindSource(trigger, params, services);
    if (kindSource.error) return kindSource;
    const gating = TriggerUpdatePatch._gating(trigger, params);
    if (gating.error) return gating;
    const source = { ...kindSource.source, ...gating.source };
    if (Object.keys(source).length) patch.source = source;
    const conflict = TriggerUpdatePatch._batchResultConflict(trigger, patch.source);
    if (conflict) return { error: conflict };
    return { patch };
  }

  static hasChanges(patch) {
    return Object.keys(patch).length > 1;
  }

  static _action(params, services) {
    const action = {};
    if (params.prompt != null) action.prompt = params.prompt;
    if (params.mode != null) action.mode = params.mode;
    if (params.agent_id !== undefined) {
      const pick = services.resolveAgentId(params.agent_id);
      if (pick.error) return { error: pick.error };
      action.agentId = pick.agentId;
    }
    if (params.expect !== undefined) {
      action.expect = params.expect && typeof params.expect === 'object' && Object.keys(params.expect).length ? params.expect : null;
    }
    if (params.artifact_root_id !== undefined) action.artifactRootId = params.artifact_root_id ? String(params.artifact_root_id) : null;
    return { action };
  }

  static _kindSource(trigger, params, services) {
    if (trigger.kind === 'file') return TriggerUpdatePatch._fileSource(params, services);
    if (trigger.kind === 'webhook') return { source: TriggerUpdatePatch._webhookSource(params) };
    return { source: {} };
  }

  static _fileSource(params, services) {
    const src = {};
    if (params.dir != null) {
      try {
        src.dir = services.validateDir(String(params.dir));
      } catch (err) {
        return { error: err.message };
      }
    }
    if (params.glob != null) src.glob = params.glob;
    if (params.file_events != null) src.events = params.file_events;
    if (params.recursive != null) src.recursive = !!params.recursive;
    if (params.allow_write != null) src.allowWrite = !!params.allow_write;
    return { source: src };
  }

  static _webhookSource(params) {
    const src = {};
    if (params.respond != null) src.respond = params.respond;
    if (params.preset != null) src.preset = params.preset;
    if (params.auth_header !== undefined) src.authHeader = params.auth_header || '';
    return src;
  }

  static _gating(trigger, params) {
    const g = TriggerGatingParams.toSource(params);
    const quietError = TriggerGatingParams.quietHoursError(g);
    if (quietError) return { error: quietError };
    const current = trigger.source || {};
    if (g.batch && g.batch.keepWindow) g.batch = current.batch ? { windowMs: current.batch.windowMs, max: g.batch.max } : null;
    if (g.memory && g.memory.runsOnly) g.memory = current.memory ? { ...current.memory, runs: g.memory.runs } : null;
    else if (g.memory && g.memory.keepRuns) g.memory = { ...(current.memory || {}), runs: current.memory ? current.memory.runs : undefined };
    return { source: g };
  }

  static _batchResultConflict(trigger, patchSource) {
    if (trigger.kind !== 'webhook') return null;
    const current = trigger.source || {};
    const respond = (patchSource && patchSource.respond) || current.respond;
    const batch = patchSource && 'batch' in patchSource ? patchSource.batch : current.batch;
    return batch && respond === 'result' ? 'a batch window cannot be combined with respond=result; use ack' : null;
  }
}

module.exports = TriggerUpdatePatch;
