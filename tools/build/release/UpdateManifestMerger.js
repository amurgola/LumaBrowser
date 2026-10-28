class UpdateManifestMerger {
  static VERSION_LINE = /^version:\s*(.+?)\s*$/;
  static FILES_LINE = /^files:\s*$/;
  static INDENTED = /^\s+\S/;

  static merge(primaryText, secondaryTexts) {
    const primary = UpdateManifestMerger._parse(primaryText, 'primary');
    const extra = [];
    secondaryTexts.forEach((text, i) => {
      const secondary = UpdateManifestMerger._parse(text, `secondary ${i + 1}`);
      if (secondary.version !== primary.version) {
        throw new Error(`Version mismatch: the primary manifest is ${primary.version}, secondary ${i + 1} is ${secondary.version}.`);
      }
      extra.push(...secondary.fileLines);
    });
    const lines = primary.lines.slice();
    lines.splice(primary.filesEnd, 0, ...extra);
    return lines.join('\n');
  }

  static _parse(text, label) {
    const lines = String(text).split(/\r?\n/);
    const versionLine = lines.map((line) => line.match(UpdateManifestMerger.VERSION_LINE)).find(Boolean);
    if (!versionLine) throw new Error(`The ${label} manifest has no version line.`);
    const filesStart = lines.findIndex((line) => UpdateManifestMerger.FILES_LINE.test(line));
    if (filesStart < 0) throw new Error(`The ${label} manifest has no files list.`);
    let filesEnd = filesStart + 1;
    while (filesEnd < lines.length && UpdateManifestMerger.INDENTED.test(lines[filesEnd])) filesEnd++;
    return { lines, version: versionLine[1], filesEnd, fileLines: lines.slice(filesStart + 1, filesEnd) };
  }
}

module.exports = UpdateManifestMerger;
