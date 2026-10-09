export default class NetErrorText {
  static CRASHED = {
    title: 'This page crashed',
    message: 'Something went wrong while displaying this page. LumaBrowser already tried once to recover it.',
    hints: ['Reload to try again', 'If it keeps crashing, the page may need more memory than is available'],
  };

  static RULES = [
    {
      test: (c) => [-105, -137, -800, -801, -803].includes(c),
      title: 'Site not found',
      message: 'The address for %h could not be found.',
      hints: ['Check the spelling of the address', 'Check your internet connection or DNS settings'],
    },
    {
      test: (c) => c === -102 || c === -104,
      title: '%h refused to connect',
      titleHost: 'The site',
      message: 'The server for %h did not accept the connection.',
      hints: ['The site may be down or blocking connections', 'Check any proxy or firewall settings'],
    },
    {
      test: (c) => c === -7 || c === -118,
      title: 'The site took too long to respond',
      message: '%h did not answer in time.',
      hints: ['Check your internet connection', 'Try again in a moment'],
    },
    {
      test: (c) => c <= -200 && c > -300,
      title: 'Your connection is not private',
      message: 'The security certificate for %h could not be verified. LumaBrowser stopped the connection.',
      hints: ['The certificate may be expired or issued for a different site', 'Check the system clock is correct'],
    },
    {
      test: (c) => c === -20 || c === -22 || c === -27,
      title: 'This page was blocked',
      message: 'A blocking rule stopped the request to %h.',
      hints: ['Check the ad blocker and any Chrome extension rules in Settings'],
    },
    {
      test: (c) => c === -106 || c === -130,
      title: 'No internet connection',
      message: 'LumaBrowser could not reach the network.',
      hints: ['Check the network cable or Wi-Fi', 'Check any proxy settings'],
    },
  ];

  static FALLBACK = {
    title: 'This site cannot be reached',
    message: 'LumaBrowser could not load %h.',
    hints: ['Reload to try again', 'Check your internet connection'],
  };

  static describe(code, desc, host) {
    const rule = NetErrorText._rule(code, desc);
    const title = rule.titleHost ? rule.title.replace('%h', host || rule.titleHost) : rule.title;
    return { title, message: rule.message.replace('%h', host || 'this site'), hints: rule.hints.slice() };
  }

  static _rule(code, desc) {
    if (desc === 'CRASHED') return NetErrorText.CRASHED;
    return NetErrorText.RULES.find((r) => r.test(code)) || NetErrorText.FALLBACK;
  }
}
