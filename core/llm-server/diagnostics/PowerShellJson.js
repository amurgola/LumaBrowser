class PowerShellJson {
  static BOM = String.fromCharCode(0xfeff);

  static parseRows(stdout) {
    try {
      const parsed = JSON.parse(PowerShellJson.stripBom(stdout || '') || 'null');
      if (!parsed) return [];
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (_) {
      return null;
    }
  }

  static stripBom(text) {
    return text.startsWith(PowerShellJson.BOM) ? text.slice(1) : text;
  }
}

module.exports = PowerShellJson;
