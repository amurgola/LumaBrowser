const FunctionSchema = require('./FunctionSchema');

class FenceFallbackDoc {
  static FENCE = '```';

  static build(names, schemas) {
    const wanted = (names || []).filter(Boolean);
    if (!wanted.length) return null;
    const byName = new Map((schemas || []).map((schema) => [FunctionSchema.nameOf(schema), schema && schema.function]));
    const blocks = wanted.map((name) => FenceFallbackDoc._toolBlock(name, byName.get(name)));
    return FenceFallbackDoc._header(wanted) + `Parameter contract:\n${blocks.join('\n')}`;
  }

  static _header(wanted) {
    const fence = FenceFallbackDoc.FENCE;
    return 'NOT a native function on this model: '
      + `${wanted.map((name) => '`' + name + '`').join(', ')}. `
      + 'Do NOT call it through the function-calling channel (its arguments arrive empty there). '
      + 'Write it as a fenced block in your reply text, exactly:\n'
      + `${fence}tool\n{"tool": "${wanted[0]}", "params": { ...arguments... }}\n${fence}\n`;
  }

  static _toolBlock(name, fn) {
    if (!fn) return `- ${name}`;
    const props = (fn.parameters && fn.parameters.properties) || {};
    const required = new Set((fn.parameters && fn.parameters.required) || []);
    const params = Object.entries(props)
      .map(([key, def]) => FenceFallbackDoc._paramLine(key, def, required.has(key)))
      .join('\n');
    return `- ${name}: ${fn.description}\n  params:\n${params}`;
  }

  static _paramLine(key, def, isRequired) {
    const description = def && def.description ? String(def.description).replace(/\s+/g, ' ').trim() : '';
    const choices = def && Array.isArray(def.enum) ? ` one of ${def.enum.map((e) => JSON.stringify(e)).join('|')}` : '';
    return `    "${key}": ${(def && def.type) || 'string'}${choices}${isRequired ? ' (required)' : ''}${description ? ' -- ' + description : ''}`;
  }
}

module.exports = FenceFallbackDoc;
