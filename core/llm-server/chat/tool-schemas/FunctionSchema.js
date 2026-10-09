class FunctionSchema {
  static build(name, description, properties, required) {
    const parameters = { type: 'object', properties: structuredClone(properties || {}) };
    if (required && required.length) parameters.required = [...required];
    return { type: 'function', function: { name, description, parameters } };
  }

  static nameOf(schema) {
    return (schema && schema.function && schema.function.name) || null;
  }
}

module.exports = FunctionSchema;
