# KernelControl

`core/shell/shellClassifier/rules/system/KernelControl.js`

[HostCapability](HostCapability.md) for live kernel, mount and module changes.

- Forbidden: `umount -a`; `mount` whose mount point (last word) or `umount` whose operands classify as protected
  via [SystemPaths](../../SystemPaths.md) (device operands are skipped). The reason quotes the path finding.
  `mount /dev/sdb1 /mnt/usb` is fine; `mount -o remount,ro /` is not.
- Mass-destructive: `swapoff -a`, `sysctl` writes (`-w`, `-p`, `--system`, `key=value`), loading or unloading
  kernel modules or extensions (`insmod`, `rmmod`, `modprobe`, `kextload`, `kextunload`, `kmutil load|unload`).
- Reads (`sysctl -a`, `modprobe -c`, dry runs) have no opinion.
