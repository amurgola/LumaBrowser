const CodeValidator = require('../../../../validation/CodeValidator');
const ChatToolHandler = require('./ChatToolHandler');

class ValidateCodeHandler extends ChatToolHandler {
  static NO_CODE = 'validate_code requires "code" (the source to check).';

  names() {
    return ['validate_code'];
  }

  async execute(_name, params) {
    const code = params && (params.code != null ? params.code : params.content);
    if (code == null || !String(code).trim()) return { success: false, error: ValidateCodeHandler.NO_CODE };
    const v = await CodeValidator.validate({
      language: params && (params.language || params.lang),
      filename: params && (params.filename || params.file),
      content: code,
    });
    return {
      success: true,
      ok: v.ok,
      supported: v.supported,
      summary: v.summary,
      diagnostics: v.diagnostics,
      message: CodeValidator.formatForModel(v),
    };
  }
}

module.exports = ValidateCodeHandler;
