class McpEnvelope {
  static wrap(result, isError) {
    return { content: [{ type: 'text', text: JSON.stringify(result) }], isError: !!isError };
  }
}

module.exports = McpEnvelope;
