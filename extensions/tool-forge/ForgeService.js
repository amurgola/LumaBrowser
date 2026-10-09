const CodeHash = require('./CodeHash');
const ToolNames = require('./ToolNames');
const ToolDraftInput = require('./ToolDraftInput');
const ToolBundleCodec = require('./ToolBundleCodec');
const PendingTestConfig = require('./PendingTestConfig');

class ForgeService {
  static RESULT_PREVIEW_CHARS = 500;

  constructor({ store, configStore, host, validator, getExistingNames, enableTool, logger } = {}) {
    this._store = store;
    this._config = configStore;
    this._host = host;
    this._enableTool = enableTool || (() => ({}));
    this._logger = logger || console;
    this._names = new ToolNames({ store, getExistingNames });
    this._draftInput = new ToolDraftInput({ validator, names: this._names });
    this._bundles = new ToolBundleCodec({ store, names: this._names });
    this._pendingConfig = new PendingTestConfig();
  }

  async createTool(input = {}) {
    const checked = await this._draftInput.check(input);
    if (checked.error) return checked.error;
    const record = this._store.upsertDraft({ ...checked.fields, lastTest: null });
    return this._createdResult(record, checked.fields);
  }

  async testTool(input = {}) {
    const tool = this._store.get(String(input.name || ''));
    if (!tool) return this._names.notFound(input.name);
    const overrides = input.configOverrides && typeof input.configOverrides === 'object' ? input.configOverrides : null;
    const args = input.args && typeof input.args === 'object' ? input.args : {};
    const result = await this._host.run(tool, args, overrides);
    if (result.success) this._recordPass(tool, args, overrides, result);
    return ForgeService._testedResult(result);
  }

  async publishTool(input = {}, ctx = {}) {
    const tool = this._store.get(String(input.name || ''));
    if (!tool) return this._names.notFound(input.name);
    const conversationId = (ctx && ctx.conversationId) || null;
    if (tool.status === 'published') return this._alreadyPublished(tool, conversationId);
    const gateError = ForgeService._publishGateError(tool);
    if (gateError) return { success: false, error: gateError };
    return this._publish(tool, conversationId);
  }

  exportBundle(name) {
    return this._bundles.exportBundle(name);
  }

  importBundle(bundle) {
    return this._bundles.importBundle(bundle);
  }

  _createdResult(record, fields) {
    const others = this._names.summary(record.name);
    const slots = fields.configSlots;
    return {
      success: true,
      name: record.name,
      version: record.version,
      status: record.status,
      configSlots: slots.map((slot) => ({ key: slot.key, required: slot.required, secret: slot.secret })),
      allowedHosts: fields.allowedHosts,
      ...(others.length ? { otherTools: others } : {}),
      next: `Draft saved (v${record.version}). Call test_tool with name "${record.name}" and representative args to verify it works before publishing.`
        + (slots.length
          ? ' It declares config slots: if the user has given you the values (an API key etc.), pass them as configOverrides to test_tool; they are saved with the tool when you publish.'
          : ''),
    };
  }

  _recordPass(tool, args, overrides, result) {
    const codeHash = CodeHash.of(tool.code);
    this._store.patch(tool.id, {
      lastTest: { ok: true, codeHash, at: Date.now(), sampleArgs: args, resultPreview: String(result.result || '').slice(0, ForgeService.RESULT_PREVIEW_CHARS) },
    });
    this._pendingConfig.remember(tool, codeHash, overrides);
  }

  _alreadyPublished(tool, conversationId) {
    return {
      success: true,
      name: tool.name,
      alreadyPublished: true,
      enabled: this._enable(tool.name, conversationId),
      toolCatalogChanged: true,
      next: `"${tool.name}" is already published and enabled: call it directly.`,
    };
  }

  _publish(tool, conversationId) {
    this._store.patch(tool.id, { status: 'published', publishedAt: Date.now() });
    const configSaved = this._savePendingConfig(tool);
    const registered = this._host.refresh();
    const enabled = this._enable(tool.name, conversationId);
    const missing = this._config.status(tool.name, tool.configSlots || []).missingRequired || [];
    return {
      success: true,
      name: tool.name,
      registered,
      enabled,
      toolCatalogChanged: true,
      ...(configSaved.length ? { configSaved } : {}),
      ...(missing.length ? { missingConfig: missing } : {}),
      next: ForgeService._publishedNext(tool.name, configSaved, missing),
    };
  }

  _savePendingConfig(tool) {
    const values = this._pendingConfig.take(tool.name, CodeHash.of(tool.code));
    if (!values) return [];
    try {
      this._config.setValues(tool.name, values, tool.configSlots || []);
      return Object.keys(values);
    } catch (error) {
      if (this._logger.warn) this._logger.warn('tool-forge config carry-over failed', error);
      return [];
    }
  }

  _enable(name, conversationId) {
    try {
      return this._enableTool(name, { conversationId }) || {};
    } catch (error) {
      if (this._logger.warn) this._logger.warn('tool-forge enable failed', error);
      return { error: (error && error.message) || String(error) };
    }
  }

  static _publishGateError(tool) {
    const passing = tool.lastTest && tool.lastTest.ok && tool.lastTest.codeHash === CodeHash.of(tool.code);
    if (passing) return null;
    return tool.lastTest
      ? 'The code changed since the last passing test. Call test_tool again before publishing.'
      : 'This tool has not passed a test yet. Call test_tool with representative args first.';
  }

  static _testedResult(result) {
    return {
      success: result.success,
      result: result.result,
      error: result.error,
      truncated: result.truncated,
      missingConfig: result.missingConfig,
      next: result.success
        ? 'Test passed. Review the result above; if it looks right, call publish_tool to make it available.'
        : 'Test failed. Fix the code (call create_tool again with the same name) or configuration, then test again.',
    };
  }

  static _publishedNext(name, configSaved, missing) {
    return `Published and enabled "${name}": you can call it now, by name, in this chat. `
      + (configSaved.length ? `Saved config: ${configSaved.join(', ')}. ` : '')
      + (missing.length
        ? `It still needs config before it can run: ${missing.join(', ')}. Ask the user for the values (then re-test with configOverrides and re-publish), or have them fill Setup → My Tools.`
        : 'Tell the user it is ready; the gear panel lets them turn it off per chat.');
  }
}

module.exports = ForgeService;
