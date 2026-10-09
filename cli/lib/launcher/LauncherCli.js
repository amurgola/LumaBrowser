const fs = require('fs');
const ConsoleOutput = require('./ConsoleOutput');
const AppInstaller = require('./AppInstaller');
const AppProcess = require('../connect/AppProcess');
const InstallRecord = require('../connect/InstallRecord');
const LumaHome = require('../connect/LumaHome');

const { CYAN, YELLOW, DIM, RESET } = ConsoleOutput;

class LauncherCli {
  static HELP_FLAGS = ['help', '--help', '-h'];

  constructor({ out = new ConsoleOutput(), installer } = {}) {
    this.out = out;
    this.installer = installer || new AppInstaller(out);
  }

  static async main(argv) {
    const cli = new LauncherCli();
    try {
      await cli.dispatch(argv);
    } catch (e) {
      cli.out.err(`lumabrowser: ${e.message}`);
      process.exit(1);
    }
  }

  async dispatch([rawCmd, ...extraArgs]) {
    const cmd = (rawCmd || 'start').toLowerCase();
    switch (cmd) {
      case 'start': return this.start(extraArgs);
      case 'agent': process.exitCode = await require('../AgentCli').main(extraArgs); return undefined;
      case 'install': return this.installer.install({ force: false });
      case 'update': case 'upgrade': return this.installer.install({ force: true });
      case 'uninstall': case 'remove': return this.uninstall();
      case 'version': case '--version': case '-v': return this.version();
      default:
        if (rawCmd && !LauncherCli.HELP_FLAGS.includes(cmd)) this.out.warn(`Unknown command: ${rawCmd}`);
        return this.help();
    }
  }

  async start(extraArgs) {
    const current = InstallRecord.read();
    const record = current && current.executable && fs.existsSync(current.executable)
      ? current
      : await this.installer.install({ force: false });
    this.out.ok(`Launching LumaBrowser ${record.version}…`);
    AppProcess.launch(record.executable, extraArgs);
    this.out.log(`${DIM}Tip: run \`npx lumabrowser update\` to pull the newest release.${RESET}`);
  }

  uninstall() {
    if (!fs.existsSync(LumaHome.dir())) { this.out.log('Nothing to uninstall.'); return; }
    fs.rmSync(LumaHome.dir(), { recursive: true, force: true });
    this.out.ok('Removed cached LumaBrowser installation.');
  }

  version() {
    const current = InstallRecord.read();
    if (!current) {
      this.out.log('LumaBrowser is not yet installed.');
      this.out.log(`${DIM}Run \`npx lumabrowser start\` to install and launch.${RESET}`);
      return;
    }
    this.out.log(`LumaBrowser ${current.version}`);
    this.out.log(`${DIM}  asset:      ${current.asset}${RESET}`);
    this.out.log(`${DIM}  executable: ${current.executable}${RESET}`);
    this.out.log(`${DIM}  installed:  ${current.installedAt}${RESET}`);
  }

  help() {
    this.out.log(`
${CYAN}LumaBrowser${RESET}: browser with notification interception and AI automation

${YELLOW}Usage:${RESET}
  npx lumabrowser ${DIM}[command]${RESET}

${YELLOW}Commands:${RESET}
  start         Launch LumaBrowser (downloads on first run) ${DIM}[default]${RESET}
  agent <name>  Talk to one of your agents from this terminal ${DIM}(also: luma <name>)${RESET}
  update        Force re-download of the latest version
  uninstall     Remove the cached LumaBrowser installation
  version       Print the installed LumaBrowser version
  help          Show this message

${YELLOW}Examples:${RESET}
  ${DIM}# First run: downloads and launches${RESET}
  npx lumabrowser start

  ${DIM}# Pull the newest release${RESET}
  npx lumabrowser update

${YELLOW}Cache directory:${RESET} ${DIM}${LumaHome.dir()}${RESET}
${YELLOW}Docs:${RESET}          ${DIM}https://lumabyte.com${RESET}
`);
  }
}

module.exports = LauncherCli;
