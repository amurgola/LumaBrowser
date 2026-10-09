import ByteFormatter from '../format/ByteFormatter.js';

export default class HardwareText {
  static shortGpuName(raw) {
    return String(raw || '')
      .replace(/^NVIDIA\s+GeForce\s+/i, '').replace(/^NVIDIA\s+/i, '')
      .replace(/^AMD\s+Radeon\s+/i, '').replace(/^AMD\s+/i, '')
      .replace(/^Intel\(R\)\s+/i, '').replace(/^Intel\s+/i, '')
      .replace(/\(TM\)|\(R\)/gi, '').replace(/\s+/g, ' ').trim();
  }

  static hardwareLine(hw) {
    if (!hw) return '';
    const parts = [HardwareText._gpuPart(hw)];
    if (hw.ramTotalBytes) parts.push(ByteFormatter.gb(hw.ramTotalBytes) + ' RAM');
    return parts.join(', ');
  }

  static _gpuPart(hw) {
    const gpus = Array.isArray(hw.gpus) ? hw.gpus.filter((g) => g && (g.name || g.totalBytes)) : [];
    if (gpus.length) {
      return gpus.map((g) => (HardwareText.shortGpuName(g.name) || 'GPU')
        + (g.totalBytes ? ' (' + ByteFormatter.gb(g.totalBytes) + ')' : '')).join(' + ');
    }
    if (hw.gpuName) {
      return HardwareText.shortGpuName(hw.gpuName) + (hw.vramTotalBytes ? ' (' + ByteFormatter.gb(hw.vramTotalBytes) + ')' : '');
    }
    return 'No dedicated graphics card';
  }
}
