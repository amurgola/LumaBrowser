'use strict';

const vscode = require('vscode');

class LumaSettings {
  static SECTION = 'luma';

  static read() {
    const c = vscode.workspace.getConfiguration(LumaSettings.SECTION);
    return {
      appExecutable: c.get('appExecutable', ''),
      autoStart: c.get('autoStart', true),
      approval: c.get('approval', 'ask'),
      openEditedFiles: c.get('openEditedFiles', true),
      showReasoning: c.get('showReasoning', false),
      suggestFollowups: c.get('suggestFollowups', true),
      defaultAgent: c.get('defaultAgent', ''),
      approvalNotifications: c.get('approvalNotifications', true),
    };
  }

  static workspaceRoot() {
    const f = (vscode.workspace.workspaceFolders || []).find((w) => w.uri.scheme === 'file');
    return f ? f.uri.fsPath : '';
  }

  static async update(key, value) {
    await vscode.workspace.getConfiguration(LumaSettings.SECTION).update(key, value, vscode.ConfigurationTarget.Global);
  }
}

module.exports = LumaSettings;
