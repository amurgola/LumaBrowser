# DiskWipeTools

`core/shell/shellClassifier/rules/filesystem/DiskWipeTools.js`

Tools that destroy a whole disk, volume or boot setup rather than files. Checked by
[FilesystemRule](../FilesystemRule.md) before any file operation.

## Methods

- `DiskWipeTools.reasonFor(command)`: the forbidden reason, or `null`. A call made only of help/version words
  (`--help`, `-V`, `/?`) is never a wipe.
- `DiskWipeTools.PROFILES`: `{ covers(name), wipes(command), reason }` entries:
  - formatters: `mkfs`, `mkfs.*`, `mke2fs`, `mkntfs`, `mkdosfs`, `mkexfatfs`, `mkswap`, `newfs`, `newfs_*`;
    Windows `format`;
  - raw-device writers: `dd` with `of=` a [raw device](../../hostPaths/RawDevicePath.md) (reading a device or
    writing `/dev/null` is fine), `shred` on a device, `blkdiscard`;
  - firmware erase: `nvme format|sanitize`, `hdparm --security-erase*|--sanitize*`;
  - partition editors: `diskpart`, `cfdisk`, and `fdisk`, `sfdisk`, `parted`, `gdisk`, `sgdisk` unless listing
    (`-l`, `--dump`, `parted DEV print`, ...); `wipefs` only with `-a`/`-o`;
  - `diskutil` erase and partition verbs, `diskutil apfs deleteContainer|deleteVolume|eraseVolume`;
  - disk cmdlets (`Format-Volume`, `Clear-Disk`, `Initialize-Disk`, partition cmdlets, `Reset-PhysicalDisk`);
  - `cipher /w`;
  - boot configuration: `bootrec`, `bcdboot`, `bcdedit` except bare or `/enum`/`/v`, `efibootmgr` write flags;
  - `fsutil` changes in the file, volume, behavior, repair, sparse, reparsepoint and resource areas (queries pass).

## Why

Sources: util-linux (fdisk, sfdisk, wipefs, blkdiscard), coreutils dd/shred, nvme-cli, macOS diskutil, Windows
diskpart/cipher/bcdedit/fsutil docs. Listing forms are left alone because models run them to inspect disks.
