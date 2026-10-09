class FormFieldResolver {
  static async resolve(llmFallbackService, tabId, fields) {
    const resolved = [];
    for (const field of fields) {
      resolved.push(await FormFieldResolver._resolveField(llmFallbackService, tabId, field));
    }
    return resolved;
  }

  static async _resolveField(llmFallbackService, tabId, field) {
    const description = field.llmFallback || `Form field for value "${field.value}"`;
    const resolution = await llmFallbackService.resolveSelector(tabId, description, 'fill', field.selector || field.label);
    return { selector: resolution.success ? resolution.selector : field.selector, value: field.value };
  }
}

module.exports = FormFieldResolver;
