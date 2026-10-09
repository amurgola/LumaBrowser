class GeneratedPayload {
  static PAYLOAD_TOOLS = new Set([
    'create_artifact',
    'edit_artifact',
    'create_live_artifact',
    'update_artifact_data',
    'validate_code',
    'send_webhook',
  ]);

  static MIN_PAYLOAD_CHARS = 400;

  static carries(toolName, params) {
    if (!GeneratedPayload.PAYLOAD_TOOLS.has(String(toolName || ''))) return false;
    const size = GeneratedPayload._serializedSize(params);
    return size > GeneratedPayload.MIN_PAYLOAD_CHARS;
  }

  static _serializedSize(params) {
    try { return JSON.stringify(params || {}).length; } catch (_) { return 0; }
  }
}

module.exports = GeneratedPayload;
