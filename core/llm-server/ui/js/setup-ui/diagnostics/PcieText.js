export default class PcieText {
  static GB_PER_LANE = { 1: 0.25, 2: 0.5, 3: 0.985, 4: 1.969, 5: 3.938, 6: 7.563 };

  static describe(pcie) {
    if (!pcie) return null;
    const { currentGen: curG, maxGen: maxG, currentWidth: curW, maxWidth: maxW } = pcie;
    const cur = (curG != null && curW != null) ? `Gen ${curG} ×${curW}` : null;
    const max = (maxG != null && maxW != null) ? `Gen ${maxG} ×${maxW}` : null;
    const downtrained = (curG != null && maxG != null && curG < maxG) || (curW != null && maxW != null && curW < maxW);
    const bw = (curG != null && curW != null && PcieText.GB_PER_LANE[curG])
      ? (PcieText.GB_PER_LANE[curG] * curW).toFixed(1) + ' GB/s'
      : null;
    return { cur, max, downtrained, bw };
  }
}
