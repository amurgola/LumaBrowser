const ReadOnlyCatalog = require('./ReadOnlyCatalog');
const PlainReaderProfiles = require('./PlainReaderProfiles');
const SearchToolProfiles = require('./SearchToolProfiles');
const StreamEditorProfiles = require('./StreamEditorProfiles');
const ViewerProfiles = require('./ViewerProfiles');
const NetworkProfiles = require('./NetworkProfiles');
const SystemQueryProfiles = require('./SystemQueryProfiles');
const ShellBuiltinProfiles = require('./ShellBuiltinProfiles');

class PosixUtilityCatalog extends ReadOnlyCatalog {
  static GROUPS = Object.freeze([
    PlainReaderProfiles, SearchToolProfiles, StreamEditorProfiles, ViewerProfiles, NetworkProfiles, SystemQueryProfiles, ShellBuiltinProfiles,
  ]);

  constructor() {
    super(PosixUtilityCatalog.GROUPS.flatMap((group) => group.profiles()));
  }
}

module.exports = PosixUtilityCatalog;
