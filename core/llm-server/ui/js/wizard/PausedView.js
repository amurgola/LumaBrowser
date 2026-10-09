export default class PausedView {
  static show(wizard, body, resume) {
    wizard.state.busy = false;
    wizard.setCloseDisabled(false);
    body.innerHTML = '<div class="wz-prog">'
      + '<div class="wz-prog-phase">Download paused</div>'
      + '<div class="wz-prog-sub">Everything downloaded so far is saved. '
      + 'Resume now, or close this and run Easy Setup again later: it picks up '
      + 'from the same place.</div>'
      + '<div class="wz-prog-actions">'
      + '<button class="luma-btn primary wz-resume" type="button">Resume download</button>'
      + '</div></div>';
    body.querySelector('.wz-resume').addEventListener('click', () => resume());
  }
}
