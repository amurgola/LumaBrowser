import ByteFormatter from '../../format/ByteFormatter.js';
import Dialogs from '../../dialogs/Dialogs.js';

export default class PrereleaseInstall {
  static FEED_ERROR = 'Could not read the release feed.';

  constructor(ctx, progress, actions) {
    this._ctx = ctx;
    this._progress = progress;
    this._actions = actions;
  }

  async run(id) {
    const r = this._ctx.runtimes.get(id) || {};
    const name = r.name || id;
    const { candidate, error } = await this._resolve(id);
    if (error) { await Dialogs.alert(`Could not check for pre-release builds: ${error}`); return; }
    if (!candidate) { await Dialogs.alert(`No pre-release build of ${name} is published for this platform.`); return; }
    const current = r.manifest && r.manifest.release && r.manifest.release.tag;
    if (current && current === candidate.tag) {
      await Dialogs.alert(`${name} is already on ${candidate.tag}: that is the newest build upstream has published.`);
      return;
    }
    const proceed = await Dialogs.confirm(PrereleaseInstall.confirmText(current, candidate), {
      title: `Replace ${name} with pre-release ${candidate.tag}?`,
      okLabel: 'Download and replace',
    });
    if (!proceed) return;
    await this._actions.clearManualShadow(r, id);
    await this._actions.autoInstall(id, 'prerelease');
  }

  static confirmText(current, candidate) {
    const asset = candidate.asset;
    return [
      current ? `Installed: ${current}` : 'Installed: unknown build',
      `Pre-release: ${candidate.tag}${candidate.publishedAt ? ' (' + new Date(candidate.publishedAt).toLocaleDateString() + ')' : ''}`,
      asset && asset.name ? `Download: ${asset.name}${asset.size ? ' · ' + ByteFormatter.bytes(asset.size) : ''}` : '',
      '',
      'Pre-release builds are the freshest upstream binaries and have not been through a stable release. The current build is removed and replaced; use Update to go back to the stable release.',
    ].filter((line) => line !== '').join('\n');
  }

  async _resolve(id) {
    this._progress.setButtonsDisabled(id, true);
    this._progress.set(id, { phase: 'Checking upstream builds…', indeterminate: true });
    let result;
    try {
      const res = await this._ctx.api.getRuntimePrerelease(id);
      result = res && res.success ? { candidate: res.candidate } : { error: (res && res.error) || PrereleaseInstall.FEED_ERROR };
    } catch (e) {
      result = { error: (e && e.message) || PrereleaseInstall.FEED_ERROR };
    }
    this._progress.set(id, { hide: true });
    this._progress.setButtonsDisabled(id, false);
    return result;
  }
}
