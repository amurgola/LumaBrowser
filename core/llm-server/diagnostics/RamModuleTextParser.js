const HardwareText = require('./HardwareText');

class RamModuleTextParser {
  static UNIT_BYTES = { TB: 2 ** 40, GB: 2 ** 30, MB: 2 ** 20, KB: 2 ** 10 };

  static parseSystemProfiler(text) {
    const modules = [];
    for (const block of (text || '').split(/\n(?=\s{4,}[^\s].*:\s*$)/m)) {
      const field = (name) => RamModuleTextParser._field(block, name);
      const size = field('Size');
      const speed = field('Speed');
      if (!size && !speed) continue;
      const locator = block.match(/^\s{4,}(BANK [^:]+|DIMM\d+|CH[A-Z]\.DIMM\d+):/m);
      modules.push({
        capacityBytes: RamModuleTextParser.parseSize(size),
        speedMTs: RamModuleTextParser._parseMacSpeed(speed),
        configuredSpeedMTs: null,
        manufacturer: HardwareText.clean(field('Manufacturer')),
        partNumber: HardwareText.clean(field('Part Number')),
        deviceLocator: HardwareText.clean(locator && locator[1]),
        formFactor: null,
        memoryType: HardwareText.clean(field('Type')),
      });
    }
    return modules;
  }

  static parseDmidecode(text) {
    const modules = [];
    for (const block of (text || '').split(/\r?\nMemory Device\r?\n/).slice(1)) {
      const field = (name) => RamModuleTextParser._field(block, name);
      const size = (field('Size') || '').trim();
      if (/no module installed/i.test(size)) continue;
      modules.push({
        capacityBytes: RamModuleTextParser.parseSize(size),
        speedMTs: RamModuleTextParser._parseDmidecodeSpeed(field('Speed')),
        configuredSpeedMTs: RamModuleTextParser._parseDmidecodeSpeed(field('Configured Memory Speed')),
        manufacturer: HardwareText.clean(field('Manufacturer')),
        partNumber: HardwareText.clean(field('Part Number')),
        deviceLocator: HardwareText.clean(field('Locator')),
        formFactor: HardwareText.clean(field('Form Factor')),
        memoryType: HardwareText.clean(field('Type')),
      });
    }
    return modules;
  }

  static parseSize(text) {
    const match = (text || '').match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB|KB)/i);
    if (!match) return 0;
    return Math.round(parseFloat(match[1]) * RamModuleTextParser.UNIT_BYTES[match[2].toUpperCase()]);
  }

  static _field(block, name) {
    const match = block.match(new RegExp(`^\\s*${name}:\\s*(.+)$`, 'm'));
    return match ? match[1] : undefined;
  }

  static _parseMacSpeed(text) {
    const match = (text || '').match(/(\d+)\s*(MT\/s|MHz)/i);
    return match ? Number(match[1]) : null;
  }

  static _parseDmidecodeSpeed(text) {
    if (!text || /unknown/i.test(text)) return null;
    const match = text.match(/(\d+)\s*MT\/s/i);
    const speed = match ? Number(match[1]) : null;
    return speed || null;
  }
}

module.exports = RamModuleTextParser;
