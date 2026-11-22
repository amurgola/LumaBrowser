export default class DefaultsForm {
  static read(doc) {
    const value = (id) => (doc.getElementById(id) || {}).value || '';
    const ctx = value('defaultContextSelect');
    const payload = {
      modelPath: value('defaultModelSelect') || null,
      contextSize: ctx ? Number(ctx) : null,
      ...DefaultsForm.thinking(value('defaultReasoningEffort') || 'default'),
    };
    DefaultsForm._optional(doc, payload);
    return payload;
  }

  static changes(rendered, current) {
    const patch = {};
    for (const key of Object.keys(current)) {
      if (JSON.stringify(current[key]) !== JSON.stringify((rendered || {})[key])) patch[key] = current[key];
    }
    return patch;
  }

  static thinking(position) {
    const noThink = position === 'off';
    return { noThink, reasoningEffort: noThink ? 'default' : position };
  }

  static _optional(doc, payload) {
    const router = doc.getElementById('defaultGroupRouter');
    if (router) payload.groupRouter = !!router.checked;
    const routerPin = doc.getElementById('defaultGroupRouterPin');
    if (routerPin) payload.groupRouterPinRam = !!routerPin.checked;
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
