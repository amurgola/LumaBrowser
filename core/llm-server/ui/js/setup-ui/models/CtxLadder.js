export default class CtxLadder {
  static RUNGS = [
    { tokens: 8192, label: '8k' },
    { tokens: 16384, label: '16k' },
    { tokens: 32768, label: '32k' },
    { tokens: 65536, label: '64k' },
    { tokens: 131072, label: '128k' },
    { tokens: 262144, label: '256k' },
  ];

  static label(tokens) {
    const hit = CtxLadder.RUNGS.find((x) => x.tokens === Number(tokens));
    return hit ? hit.label : `${Math.round(Number(tokens) / 1024)}k`;
  }
}
