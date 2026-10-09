const ShellWords = require('../../ShellWords');
const RawDevicePath = require('../../hostPaths/RawDevicePath');

class DiskWipeTools {
  static HELP_WORDS = new Set(['--help', '-h', '--version', '-v', '/?']);
  static FORMATTERS = new Set(['mke2fs', 'mkntfs', 'mkdosfs', 'mkexfatfs', 'mkswap', 'newfs']);
  static PARTITION_LISTING = Object.freeze({
    fdisk: ['-l', '--list'],
    sfdisk: ['-l', '--list', '-d', '--dump', '-s', '--show-size', '-j', '--json', '--verify'],
    parted: ['-l', '--list'],
    gdisk: ['-l'],
    sgdisk: ['-p', '--print', '-i', '--info'],
    cfdisk: [],
    diskpart: [],
  });
  static DISKUTIL_ERASE = new Set(['erasedisk', 'erasevolume', 'reformat', 'partitiondisk', 'zerodisk', 'randomdisk', 'secureerase']);
  static APFS_ERASE = new Set(['deletecontainer', 'deletevolume', 'erasevolume']);
  static DISK_CMDLETS = new Set(['format-volume', 'clear-disk', 'initialize-disk', 'remove-partition', 'new-partition', 'set-partition', 'resize-partition', 'reset-physicaldisk']);
  static BOOT_EDITORS = new Set(['bootrec', 'bcdboot']);
  static BCDEDIT_READS = ['/enum', '/v', '/?'];
  static EFIBOOTMGR_WRITES = ['-b', '-B', '-c', '--create', '-o', '--bootorder', '-a', '-A', '--delete-bootnum', '-n', '--bootnext'];
  static FSUTIL_AREAS = new Set(['file', 'volume', 'behavior', 'repair', 'sparse', 'reparsepoint', 'resource']);
  static FSUTIL_READS = /^(query|diskfree|list|layout|state|find|filesystemtype|\?)/;

  static PROFILES = Object.freeze([
    { covers: DiskWipeTools._isFormatter, wipes: () => true, reason: 'Formatting a filesystem erases the disk.' },
    { covers: (name) => name === 'format', wipes: () => true, reason: 'format erases a drive.' },
    { covers: (name) => name === 'dd', wipes: DiskWipeTools._ddWritesDevice, reason: 'dd onto a raw device can overwrite a whole disk.' },
    { covers: (name) => name === 'shred', wipes: DiskWipeTools._targetsDevice, reason: 'shred on a raw device wipes the whole disk.' },
    { covers: (name) => name === 'blkdiscard', wipes: () => true, reason: 'blkdiscard throws away every block on the device.' },
    { covers: (name) => name === 'nvme' || name === 'hdparm', wipes: DiskWipeTools._firmwareErases, reason: 'Firmware erase commands wipe the whole drive.' },
    { covers: (name) => Object.hasOwn(DiskWipeTools.PARTITION_LISTING, name), wipes: DiskWipeTools._editsPartitions, reason: 'Partition and disk editors can wipe the drive.' },
    { covers: (name) => name === 'wipefs', wipes: (command) => command.has('-a', '--all', '-o', '--offset'), reason: 'wipefs -a erases filesystem signatures, losing the data.' },
    { covers: (name) => name === 'diskutil', wipes: DiskWipeTools._diskutilErases, reason: 'diskutil erase and partition verbs wipe a disk or volume.' },
    { covers: (name) => DiskWipeTools.DISK_CMDLETS.has(name), wipes: () => true, reason: 'Disk cmdlets can wipe or repartition the drive.' },
    { covers: (name) => name === 'cipher', wipes: (command) => command.hasPrefix('/w'), reason: 'cipher /w overwrites free space on a volume.' },
    { covers: DiskWipeTools._isBootEditor, wipes: DiskWipeTools._editsBoot, reason: 'Boot configuration edits can leave the machine unbootable.' },
    { covers: (name) => name === 'fsutil', wipes: DiskWipeTools._fsutilChanges, reason: 'fsutil can corrupt or dismount volumes.' },
  ]);

  static reasonFor(command) {
    const profile = DiskWipeTools.PROFILES.find((candidate) => candidate.covers(command.name));
    if (!profile || DiskWipeTools._asksForHelp(command)) return null;
    return profile.wipes(command) ? profile.reason : null;
  }

  static _asksForHelp(command) {
    return command.lowered.length > 0 && command.lowered.every((arg) => DiskWipeTools.HELP_WORDS.has(arg));
  }

  static _isFormatter(name) {
    return /^mkfs(\.|$)/.test(name) || /^newfs_/.test(name) || DiskWipeTools.FORMATTERS.has(name);
  }

  static _ddWritesDevice(command) {
    return command.args.some((arg) => /^of=/i.test(arg) && RawDevicePath.is(arg.slice(3)));
  }

  static _targetsDevice(command) {
    return ShellWords.nonFlags(command.args).some(RawDevicePath.is);
  }

  static _firmwareErases(command) {
    if (command.name === 'nvme') return ['format', 'sanitize'].includes(command.positionals[0]);
    return command.hasPrefix('--security-erase', '--sanitize', '--trim-sector-ranges');
  }

  static _editsPartitions(command) {
    if (command.has(...DiskWipeTools.PARTITION_LISTING[command.name])) return false;
    const steps = command.positionals.slice(1);
    return !(command.name === 'parted' && steps.length > 0 && steps.every((step) => step === 'print'));
  }

  static _diskutilErases(command) {
    const [verb, sub] = command.positionals;
    return DiskWipeTools.DISKUTIL_ERASE.has(verb) || (verb === 'apfs' && DiskWipeTools.APFS_ERASE.has(sub));
  }

  static _isBootEditor(name) {
    return name === 'bcdedit' || name === 'efibootmgr' || DiskWipeTools.BOOT_EDITORS.has(name);
  }

  static _editsBoot(command) {
    if (command.name === 'bcdedit') return command.lowered.length > 0 && !command.has(...DiskWipeTools.BCDEDIT_READS);
    if (command.name === 'efibootmgr') return command.args.some((arg) => DiskWipeTools.EFIBOOTMGR_WRITES.includes(arg));
    return true;
  }

  static _fsutilChanges(command) {
    const [area, operation = ''] = command.positionals;
    return DiskWipeTools.FSUTIL_AREAS.has(area) && !DiskWipeTools.FSUTIL_READS.test(operation);
  }
}

module.exports = DiskWipeTools;
