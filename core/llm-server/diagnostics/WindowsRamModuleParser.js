const HardwareText = require('./HardwareText');

class WindowsRamModuleParser {
  static MEMORY_TYPES = {
    0: 'Unknown', 1: 'Other', 2: 'DRAM', 3: 'Synchronous DRAM', 4: 'Cache DRAM',
    5: 'EDO', 6: 'EDRAM', 7: 'VRAM', 8: 'SRAM', 9: 'RAM', 10: 'ROM',
    11: 'Flash', 12: 'EEPROM', 13: 'FEPROM', 14: 'EPROM', 15: 'CDRAM',
    16: '3DRAM', 17: 'SDRAM', 18: 'SGRAM', 19: 'RDRAM', 20: 'DDR',
    21: 'DDR2', 22: 'DDR2 FB-DIMM', 24: 'DDR3', 25: 'FBD2', 26: 'DDR4',
    27: 'LPDDR', 28: 'LPDDR2', 29: 'LPDDR3', 30: 'LPDDR4', 31: 'Logical NV',
    32: 'HBM', 33: 'HBM2', 34: 'DDR5', 35: 'LPDDR5',
  };

  static FORM_FACTORS = {
    0: 'Unknown', 1: 'Other', 8: 'DIMM', 9: 'TSOP', 10: 'Row of chips',
    11: 'RIMM', 12: 'SODIMM', 13: 'SRIMM', 14: 'SMD', 15: 'SSMP',
    16: 'QFP', 17: 'TQFP', 18: 'SOIC', 19: 'LCC', 20: 'PLCC',
    21: 'BGA', 22: 'FPBGA', 23: 'LGA',
  };

  static parseRows(rows) {
    return rows.map(WindowsRamModuleParser._toModule);
  }

  static _toModule(row) {
    return {
      capacityBytes: Number(row.Capacity) || 0,
      speedMTs: Number(row.Speed) || null,
      configuredSpeedMTs: Number(row.ConfiguredClockSpeed) || null,
      manufacturer: HardwareText.clean(row.Manufacturer),
      partNumber: HardwareText.clean(row.PartNumber),
      deviceLocator: HardwareText.clean(row.DeviceLocator),
      formFactor: WindowsRamModuleParser.FORM_FACTORS[Number(row.FormFactor)] || null,
      memoryType: WindowsRamModuleParser.MEMORY_TYPES[WindowsRamModuleParser._typeId(row)] || null,
    };
  }

  static _typeId(row) {
    return (Number(row.SMBIOSMemoryType) || 0) || (Number(row.MemoryType) || 0);
  }
}

module.exports = WindowsRamModuleParser;
