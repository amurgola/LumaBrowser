class NinferDevicePicker {
  static GPU_NAME_RE = /RTX 5090/i;

  static pick(manifest, diagnostics) {
    if (manifest && manifest.mode === 'wsl') return NinferDevicePicker._fromManifest(manifest);
    return NinferDevicePicker._fromDiagnostics(diagnostics)
      || (manifest && manifest.cudaDevice != null ? NinferDevicePicker._fromManifest(manifest) : null)
      || { index: null, vramBytes: null, name: null };
  }

  static _fromManifest(manifest) {
    return { index: manifest.cudaDevice, vramBytes: manifest.vramBytes || null, name: manifest.gpuName || null };
  }

  static _fromDiagnostics(diagnostics) {
    const devs = diagnostics && diagnostics.cuda && Array.isArray(diagnostics.cuda.devices) ? diagnostics.cuda.devices : [];
    const i = devs.findIndex((d) => NinferDevicePicker.GPU_NAME_RE.test(String((d && d.name) || '')));
    if (i < 0) return null;
    return { index: i, vramBytes: (Number(devs[i].memoryTotalMB) || 0) * 1024 * 1024 || null, name: devs[i].name };
  }
}

module.exports = NinferDevicePicker;
