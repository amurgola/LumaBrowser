const HostCapability = require('./HostCapability');
const ServiceRequest = require('./ServiceRequest');
const CriticalServices = require('./CriticalServices');

class ServiceControl extends HostCapability {
  static SESSION_DOMAIN = /^(system|(gui|user|login)\/\d+)$/;

  covers(command) {
    return ServiceRequest.parse(command) !== null;
  }

  judge(command) {
    const request = ServiceRequest.parse(command);
    if (!request.effect) return null;
    const forbidden = request.effect === 'halt' ? ServiceControl._forbiddenReason(request) : null;
    return HostCapability.forbid(forbidden) || HostCapability.ask(`${request.label} ${request.action} changes a system service.`);
  }

  static _forbiddenReason(request) {
    const domain = request.units.find((unit) => ServiceControl.SESSION_DOMAIN.test(unit));
    if (domain) return `${request.label} ${request.action} ${domain} tears down a whole login domain and ends the session.`;
    for (const unit of request.units) {
      const consequence = CriticalServices.consequenceOf(unit);
      if (consequence) return `${unit} ${consequence}.`;
    }
    return null;
  }
}

module.exports = ServiceControl;
