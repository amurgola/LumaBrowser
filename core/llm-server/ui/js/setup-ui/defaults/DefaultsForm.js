export default class DefaultsForm {
  static read(doc) {
    const value = (id) => (doc.getElementById(id) || {}).value || '';
    const checked = (id) => !!(doc.getElementById(id) || {}).checked;
    const ctx = value('defaultContextSelect');
    const parallel = value('defaultParallelSelect');
    const payload = {
      runtimeId: value('defaultRuntimeSelect') || null,
      modelPath: value('defaultModelSelect') || null,
      contextSize: ctx ? Number(ctx) : null,
      kvCacheType: value('defaultKvSelect') || null,
      maxConcurrent: parallel ? Number(parallel) : 1,
      tensorSplit: checked('defaultTensorSplit'),
      cacheReuse: checked('defaultCacheReuse'),
      ...DefaultsForm.thinking(value('defaultReasoningEffort') || 'default'),
      usePeerGpus: checked('defaultUsePeerGpus'),
    };
    const moeCache = doc.getElementById('defaultMoeGpuCache');
    if (moeCache) payload.noMoeGpuCache = !moeCache.checked;
    DefaultsForm._optional(doc, payload);
    return payload;
  }

  static thinking(position) {
    const noThink = position === 'off';
    return { noThink, reasoningEffort: noThink ? 'default' : position };
  }

  static _optional(doc, payload) {
    const ramPin = doc.getElementById('defaultRamPin');
    if (ramPin) payload.pinModelRam = !!ramPin.checked;
    const router = doc.getElementById('defaultGroupRouter');
    if (router) payload.groupRouter = !!router.checked;
    const routerPin = doc.getElementById('defaultGroupRouterPin');
    if (routerPin) payload.groupRouterPinRam = !!routerPin.checked;
    const openvino = doc.getElementById('defaultOpenVinoDevice');
    if (openvino) payload.openvinoDevice = openvino.value || null;
    DefaultsForm._helper(doc, payload);
  }

  static _helper(doc, payload) {
    const toggle = doc.getElementById('defaultHelperModel');
    if (!toggle) return;
    const helper = { enabled: !!toggle.checked };
    const file = doc.getElementById('defaultHelperModelSelect');
    if (file) helper.modelPath = file.value || '';
    const ctx = doc.getElementById('defaultHelperContext');
    if (ctx) helper.contextSize = ctx.value ? Number(ctx.value) : null;
    payload.helperModel = helper;
  }
}
