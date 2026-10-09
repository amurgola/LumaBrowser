const fs = require('fs');
const path = require('path');
const ManifestFields = require('./ManifestFields');
const DashboardContribution = require('./DashboardContribution');

class ManifestValidator {
  static FATAL_PREFIX = 'FATAL';
  static ID_PATTERN = /^[a-z0-9-]+$/;
  static PANEL_LOCATIONS = ['bottom-bar', 'right-sidebar', 'right-panel', 'bottom', 'right'];
  static SETTINGS_PLACEMENTS = ['extensions', 'tab'];

  static validate(manifest, extDir) {
    const fatal = ManifestValidator._fatalIssue(manifest);
    if (fatal) return [fatal];
    return [
      ...ManifestValidator._fieldTypeIssues(manifest),
      ...ManifestValidator._entryPointIssues(manifest, extDir),
      ...ManifestValidator._declarativeUiIssues(manifest),
      ...ManifestValidator._actionIssues(manifest),
      ...ManifestValidator._dashboardIssues(manifest, extDir),
    ];
  }

  static fatalIssues(issues) {
    return issues.filter((issue) => issue.startsWith(ManifestValidator.FATAL_PREFIX));
  }

  static _fatalIssue(manifest) {
    if (!manifest || !manifest.id) return `${ManifestValidator.FATAL_PREFIX}: missing "id" field`;
    if (!manifest.name) return `${ManifestValidator.FATAL_PREFIX}: missing "name" field`;
    return null;
  }

  static _fieldTypeIssues(manifest) {
    const issues = [];
    if (typeof manifest.id !== 'string' || !ManifestValidator.ID_PATTERN.test(manifest.id)) {
      issues.push(`"id" should be lowercase kebab-case (got "${manifest.id}")`);
    }
    if (manifest.debugOnly !== undefined && typeof manifest.debugOnly !== 'boolean') issues.push('"debugOnly" should be a boolean');
    if (manifest.main && typeof manifest.main !== 'string') issues.push('"main" should be a string path');
    if (manifest.renderer && typeof manifest.renderer !== 'string') issues.push('"renderer" should be a string path');
    return issues;
  }

  static _entryPointIssues(manifest, extDir) {
    const issues = [];
    if (manifest.main && !fs.existsSync(path.resolve(extDir, manifest.main))) {
      issues.push(`main entry point not found: ${manifest.main}`);
    }
    if (manifest.renderer && !fs.existsSync(path.resolve(extDir, manifest.renderer))) {
      issues.push(`renderer entry point not found: ${manifest.renderer}`);
    }
    return issues;
  }

  static _declarativeUiIssues(manifest) {
    const issues = [];
    const nav = manifest.navigationBar;
    if (nav) {
      if (!nav.label) issues.push('navigationBar.label is required');
      const location = nav.panel && nav.panel.location;
      if (location && !ManifestValidator.PANEL_LOCATIONS.includes(location)) {
        issues.push(`navigationBar.panel.location must be one of: ${ManifestValidator.PANEL_LOCATIONS.join(', ')}`);
      }
    }
    if (manifest.settings && !manifest.settings.label) issues.push('settings.label is required');
    const placement = manifest.settings && manifest.settings.placement;
    if (placement !== undefined && !ManifestValidator.SETTINGS_PLACEMENTS.includes(placement)) {
      issues.push(`settings.placement must be one of: ${ManifestValidator.SETTINGS_PLACEMENTS.join(', ')}`);
    }
    return issues;
  }

  static _dashboardIssues(manifest, extDir) {
    const block = manifest.dashboard;
    if (!block) return [];
    if (typeof block !== 'object') return ['"dashboard" should be an object'];
    const issues = [];
    for (const widget of Array.isArray(block.widgets) ? block.widgets : []) {
      const w = widget && typeof widget === 'object' ? widget : {};
      if (!w.id || !DashboardContribution.ID_PATTERN.test(String(w.id))) issues.push('dashboard.widgets[].id is required (lowercase kebab-case)');
      if (!w.title) issues.push('dashboard.widgets[].title is required');
      if (typeof w.file !== 'string' || !w.file) issues.push('dashboard.widgets[].file is required');
      else if (!fs.existsSync(path.resolve(extDir, w.file))) issues.push(`dashboard widget file not found: ${w.file}`);
    }
    for (const asset of Array.isArray(block.assets) ? block.assets : []) {
      if (typeof asset !== 'string' || !fs.existsSync(path.resolve(extDir, asset))) issues.push(`dashboard asset not found: ${asset}`);
    }
    if (block.api !== undefined && (!Array.isArray(block.api) || block.api.some((m) => typeof m !== 'string'))) {
      issues.push('dashboard.api should be an array of method names');
    }
    return issues;
  }

  static _actionIssues(manifest) {
    const issues = [];
    for (const action of ManifestFields.actions(manifest)) {
      if (!action || !action.label) issues.push('extensionsAction.label is required');
      if (!action || !action.modeIntent) issues.push('extensionsAction.modeIntent is required (the chat mode to launch)');
    }
    return issues;
  }
}

module.exports = ManifestValidator;
