'use strict';

const vscode = require('vscode');

class ApprovalNotifier {
  static CHOICES = Object.freeze({ 'Allow once': 'once', 'Allow for this run': 'run', Deny: 'reject' });

  static hook(isViewVisible) {
    return (tool, detail, decide) => {
      if (isViewVisible()) return null;
      let live = true;
      vscode.window.showWarningMessage(`Luma wants to ${tool}: ${detail}`, ...Object.keys(ApprovalNotifier.CHOICES)).then((pick) => {
        if (!live || !pick) return;
        decide(ApprovalNotifier.CHOICES[pick] || 'reject');
      });
      return () => { live = false; };
    };
  }
}

module.exports = ApprovalNotifier;
