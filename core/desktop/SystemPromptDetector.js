const path = require('path');

class SystemPromptDetector {
  static BY_EXE = [
    { re: /^consent\.exe$/i, kind: 'uac', label: 'User Account Control prompt' },
    { re: /^credentialuibroker\.exe$/i, kind: 'credential', label: 'Windows Security sign-in prompt' },
    { re: /^logonui\.exe$/i, kind: 'logon', label: 'Windows sign-in screen' },
    { re: /^lockapp\.exe$/i, kind: 'lock', label: 'lock screen' },
  ];

  static BY_CLASS = [
    { re: /^Credential Dialog Xaml Host$/i, kind: 'credential', label: 'Windows Security sign-in prompt' },
    { re: /^\$\$\$Secure UAP/i, kind: 'uac', label: 'User Account Control prompt' },
  ];

  static detect({ exe, className } = {}) {
    return SystemPromptDetector._byExe(exe) || SystemPromptDetector._byClass(className);
  }

  static _byExe(exe) {
    const base = exe ? path.basename(String(exe).replace(/\\/g, '/')) : '';
    if (!base) return null;
    return SystemPromptDetector._firstMatch(SystemPromptDetector.BY_EXE, base);
  }

  static _byClass(className) {
    if (!className) return null;
    return SystemPromptDetector._firstMatch(SystemPromptDetector.BY_CLASS, className);
  }

  static _firstMatch(patterns, value) {
    const hit = patterns.find((p) => p.re.test(value));
    return hit ? { kind: hit.kind, label: hit.label } : null;
  }
}

module.exports = SystemPromptDetector;
