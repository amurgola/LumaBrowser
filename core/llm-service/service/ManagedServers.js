const ProviderConfigService = require('../ProviderConfigService');
const GroundingServerService = require('../../grounding-server/GroundingServerService');

class ManagedServers {
  static LOCAL_ID = ProviderConfigService.MANAGED_LOCAL_ID;
  static GROUNDING_ID = GroundingServerService.PROVIDER_ID;

  static NO_VISION_MESSAGE = 'The local model has no vision projector (mmproj), so it cannot see screenshots. '
    + 'Pick a vision model for the Visual grounding slot.';

  constructor() {
    this.llmServerService = null;
    this.groundingServerService = null;
  }

  static isManaged(providerKey) {
    return providerKey === ManagedServers.LOCAL_ID || providerKey === ManagedServers.GROUNDING_ID;
  }

  localEntry() {
    return ManagedServers._entryFrom(this.llmServerService, 'computeLocalProviderEntry');
  }

  groundingEntry() {
    return ManagedServers._entryFrom(this.groundingServerService, 'computeProviderEntry');
  }

  async ensureReady(config, { withVision = false } = {}) {
    const provider = config && config.provider;
    if (provider === ManagedServers.GROUNDING_ID) return this._ensureGroundingReady();
    if (provider !== ManagedServers.LOCAL_ID) return { ok: true };
    return this._ensureLocalReady(withVision);
  }

  async track(config, fn) {
    const tracks = this._tracksLocal(config);
    if (tracks) this.llmServerService.noteLocalRequestStart();
    try {
      return await fn();
    } finally {
      if (tracks) this.llmServerService.noteLocalRequestEnd();
    }
  }

  localHasVision() {
    const runtime = this.llmServerService && this.llmServerService.runtimeServer;
    const status = runtime && runtime.getStatus();
    return !!(status && status.plan && status.plan.mmprojPath);
  }

  static _entryFrom(service, method) {
    if (!service || typeof service[method] !== 'function') return null;
    try {
      return service[method]();
    } catch {
      return null;
    }
  }

  async _ensureGroundingReady() {
    const service = this.groundingServerService;
    if (!service) return { ok: false, error: 'The grounding server is not available.' };
    const result = await service.ensureRunning();
    if (result && result.success) return { ok: true };
    return { ok: false, error: (result && result.error) || 'Grounding server failed to start.', code: result && result.code };
  }

  async _ensureLocalReady(withVision) {
    const service = this.llmServerService;
    if (!service || typeof service.ensureRunning !== 'function') return { ok: true };
    try {
      const result = await service.ensureRunning(withVision ? { withVision: true } : undefined);
      return result && result.success ? { ok: true } : ManagedServers._localFailure(result);
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  static _localFailure(result) {
    return {
      ok: false,
      error: (result && result.error) || 'Failed to start the local LLM server.',
      code: result && result.code,
      runtimeId: result && result.runtimeId,
      runtimeName: result && result.runtimeName,
      installable: result && result.installable,
    };
  }

  _tracksLocal(config) {
    return config.provider === ManagedServers.LOCAL_ID
      && !!this.llmServerService
      && typeof this.llmServerService.noteLocalRequestStart === 'function';
  }
}

module.exports = ManagedServers;
