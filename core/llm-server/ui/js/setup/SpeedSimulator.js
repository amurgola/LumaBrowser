export default class SpeedSimulator {
  static LOREM = ('Local language models run entirely on your own machine, so '
    + 'your conversations never leave the device. Larger models reason more '
    + 'deeply and write more fluently, but they need more memory and generate '
    + 'text more slowly. The right balance depends on your hardware and how '
    + 'patiently you can wait for a reply. ').repeat(12);

  static CHARS_PER_TOKEN = 3.6;

  static start(outEl, tokensPerSec, stepMs = 60) {
    const per = Math.max(1, Math.round((tokensPerSec * SpeedSimulator.CHARS_PER_TOKEN) * (stepMs / 1000)));
    let shown = 0;
    return setInterval(() => {
      shown = (shown + per) % SpeedSimulator.LOREM.length;
      outEl.textContent = SpeedSimulator.LOREM.slice(0, shown);
      outEl.scrollTop = outEl.scrollHeight;
    }, stepMs);
  }
}
