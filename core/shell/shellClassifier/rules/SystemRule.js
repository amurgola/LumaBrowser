const ShellRule = require('../ShellRule');
const HostCommand = require('./HostCommand');
const PowerControl = require('./system/PowerControl');
const FirewallControl = require('./system/FirewallControl');
const NetworkLinkControl = require('./system/NetworkLinkControl');
const RegistryControl = require('./system/RegistryControl');
const ServiceControl = require('./system/ServiceControl');
const ProcessControl = require('./system/ProcessControl');
const PackageControl = require('./system/PackageControl');
const AccountControl = require('./system/AccountControl');
const ScheduleControl = require('./system/ScheduleControl');
const KernelControl = require('./system/KernelControl');
const SecurityPostureControl = require('./system/SecurityPostureControl');

class SystemRule extends ShellRule {
  static CAPABILITIES = Object.freeze([
    new PowerControl(), new FirewallControl(), new NetworkLinkControl(), new RegistryControl(), new ServiceControl(),
    new ProcessControl(), new PackageControl(), new AccountControl(), new ScheduleControl(), new KernelControl(),
    new SecurityPostureControl(),
  ]);

  assess(input) {
    const command = new HostCommand(input);
    const capability = SystemRule.capabilityFor(command);
    return capability ? capability.judge(command) : null;
  }

  static capabilityFor(command) {
    return SystemRule.CAPABILITIES.find((capability) => capability.covers(command)) || null;
  }
}

module.exports = SystemRule;
