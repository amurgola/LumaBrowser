class CpuModelIsa {
  static FULL = 'avx512_vnni_vbmi_bf16';

  static fromModelName(model) {
    const m = String(model || '');
    if (/\bThreadripper\b/i.test(m)) return CpuModelIsa._threadripper(m);
    if (/\bRyzen\b/i.test(m)) return CpuModelIsa._ryzen(m);
    if (/\bEPYC\b/i.test(m)) return CpuModelIsa._epyc(m);
    if (/\bXeon\b/i.test(m)) return CpuModelIsa._xeon(m);
    return CpuModelIsa._core(m);
  }

  static _threadripper(m) {
    return /\b[79][0-9]{3}[A-Z]*\b/.test(m) ? CpuModelIsa.FULL : 'avx2';
  }

  static _ryzen(m) {
    if (/\bRyzen AI\b/i.test(m)) return CpuModelIsa.FULL;
    if (/\b7[0-9]20[A-Z]*\b/.test(m)) return 'avx2';
    if (/\b[789][0-9]{3}[A-Z0-9]*\b/.test(m)) return CpuModelIsa.FULL;
    return 'avx2';
  }

  static _epyc(m) {
    return /\b9[0-9]{2}[45][A-Z]*\b/.test(m) ? CpuModelIsa.FULL : 'avx2';
  }

  static _xeon(m) {
    if (/\bw[3579]-\d{4}/i.test(m) || /\b(?:Platinum|Gold|Silver|Bronze)\s+[3-8][4-9]\d{2}/i.test(m) || /\bXeon(?:\(R\))?\s+6\d{3}/i.test(m)) return CpuModelIsa.FULL;
    if (/\b(?:Platinum|Gold|Silver|Bronze)\s+[3-8]3\d{2}/i.test(m)) return 'avx512_vnni_vbmi';
    if (/\b(?:Platinum|Gold|Silver|Bronze)\s+[3-8]2\d{2}/i.test(m)) return 'avx512_vnni';
    if (/\b(?:Platinum|Gold|Silver|Bronze)\s+[3-8]1\d{2}/i.test(m)) return 'avx512';
    return 'avx2';
  }

  static _core(m) {
    if (/\bi[3579]-11\d{2,3}/i.test(m)) return 'avx512_vnni_vbmi';
    if (/\bi[79]-10\d{3}X/i.test(m)) return 'avx512_vnni';
    if (/\bi[79]-[79]\d{3}X/i.test(m)) return 'avx512';
    return 'avx2';
  }
}

module.exports = CpuModelIsa;
