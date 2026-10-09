const HardwareText = require('./HardwareText');

class CudaDeviceParser {
  static QUERY_ARGS = [
    '--query-gpu=name,driver_version,memory.total,memory.free,memory.used,compute_cap,'
      + 'pcie.link.gen.current,pcie.link.gen.max,'
      + 'pcie.link.width.current,pcie.link.width.max,'
      + 'pci.device_id,pci.bus_id',
    '--format=csv,noheader,nounits',
  ];

  static VERSION_ARGS = ['--query', '-x'];

  static parseDevices(stdout) {
    return (stdout || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map(CudaDeviceParser._parseLine);
  }

  static parsePciDeviceId(text) {
    if (!text) return null;
    const match = text.trim().match(/^0x([0-9a-fA-F]{4,8})$/);
    if (!match) return null;
    const n = parseInt(match[1], 16);
    return { deviceId: (n >>> 16) & 0xffff, vendorId: n & 0xffff };
  }

  static parseCudaVersion(xml) {
    if (!xml) return null;
    const match = xml.match(/<cuda_version>([^<]+)<\/cuda_version>/i);
    return match ? match[1].trim() : null;
  }

  static _parseLine(line) {
    const parts = line.split(',').map((s) => s.trim());
    const number = HardwareText.numberOrNull;
    return {
      name: parts[0] || null,
      driverVersion: parts[1] || null,
      memoryTotalMB: number(parts[2]),
      memoryFreeMB: number(parts[3]),
      memoryUsedMB: number(parts[4]),
      computeCapability: parts[5] || null,
      pcie: CudaDeviceParser._pcie(number(parts[6]), number(parts[7]), number(parts[8]), number(parts[9])),
      pciDeviceId: CudaDeviceParser.parsePciDeviceId(parts[10]),
      pciBusId: parts[11] || null,
    };
  }

  static _pcie(currentGen, maxGen, currentWidth, maxWidth) {
    if (currentGen == null && maxGen == null && currentWidth == null && maxWidth == null) return null;
    return { currentGen, maxGen, currentWidth, maxWidth };
  }
}

module.exports = CudaDeviceParser;
