class WebDriverRouteTable {
  static ROUTES = [
    ['GET', '/status', 'status', { requiresSession: false }],
    ['POST', '/session', 'newSession', { requiresSession: false }],
    ['DELETE', '/session/:sessionId', 'deleteSession', { requiresSession: true }],

    ['GET', '/session/:sessionId/timeouts', 'getTimeouts', {}],
    ['POST', '/session/:sessionId/timeouts', 'setTimeouts', {}],

    ['POST', '/session/:sessionId/url', 'navigateTo', {}],
    ['GET', '/session/:sessionId/url', 'getCurrentUrl', {}],
    ['POST', '/session/:sessionId/back', 'goBack', {}],
    ['POST', '/session/:sessionId/forward', 'goForward', {}],
    ['POST', '/session/:sessionId/refresh', 'refresh', {}],
    ['GET', '/session/:sessionId/title', 'getTitle', {}],

    ['GET', '/session/:sessionId/window', 'getWindowHandle', {}],
    ['DELETE', '/session/:sessionId/window', 'closeWindow', {}],
    ['POST', '/session/:sessionId/window', 'switchToWindow', {}],
    ['GET', '/session/:sessionId/window/handles', 'getWindowHandles', {}],
    ['POST', '/session/:sessionId/window/new', 'newWindow', {}],
    ['POST', '/session/:sessionId/frame', 'switchToFrame', {}],
    ['POST', '/session/:sessionId/frame/parent', 'switchToParentFrame', {}],
    ['GET', '/session/:sessionId/window/rect', 'getWindowRect', {}],
    ['POST', '/session/:sessionId/window/rect', 'setWindowRect', {}],
    ['POST', '/session/:sessionId/window/maximize', 'maximize', {}],
    ['POST', '/session/:sessionId/window/minimize', 'minimize', {}],
    ['POST', '/session/:sessionId/window/fullscreen', 'fullscreen', {}],

    ['GET', '/session/:sessionId/element/active', 'getActiveElement', {}],
    ['POST', '/session/:sessionId/element', 'findElement', {}],
    ['POST', '/session/:sessionId/elements', 'findElements', {}],
    ['POST', '/session/:sessionId/element/:elementId/element', 'findElementFromElement', {}],
    ['POST', '/session/:sessionId/element/:elementId/elements', 'findElementsFromElement', {}],
    ['GET', '/session/:sessionId/element/:elementId/shadow', 'getElementShadowRoot', {}],
    ['POST', '/session/:sessionId/shadow/:shadowId/element', 'findElementFromShadow', {}],
    ['POST', '/session/:sessionId/shadow/:shadowId/elements', 'findElementsFromShadow', {}],

    ['GET', '/session/:sessionId/element/:elementId/selected', 'elementSelected', {}],
    ['GET', '/session/:sessionId/element/:elementId/attribute/:name', 'elementAttribute', {}],
    ['GET', '/session/:sessionId/element/:elementId/property/:name', 'elementProperty', {}],
    ['GET', '/session/:sessionId/element/:elementId/css/:propertyName', 'elementCss', {}],
    ['GET', '/session/:sessionId/element/:elementId/text', 'elementText', {}],
    ['GET', '/session/:sessionId/element/:elementId/name', 'elementTagName', {}],
    ['GET', '/session/:sessionId/element/:elementId/rect', 'elementRect', {}],
    ['GET', '/session/:sessionId/element/:elementId/enabled', 'elementEnabled', {}],
    ['GET', '/session/:sessionId/element/:elementId/computedrole', 'elementComputedRole', {}],
    ['GET', '/session/:sessionId/element/:elementId/computedlabel', 'elementComputedLabel', {}],

    ['POST', '/session/:sessionId/element/:elementId/click', 'elementClick', {}],
    ['POST', '/session/:sessionId/element/:elementId/clear', 'elementClear', {}],
    ['POST', '/session/:sessionId/element/:elementId/value', 'elementSendKeys', {}],

    ['GET', '/session/:sessionId/source', 'getPageSource', {}],
    ['POST', '/session/:sessionId/execute/sync', 'executeScript', {}],
    ['POST', '/session/:sessionId/execute/async', 'executeAsyncScript', {}],

    ['GET', '/session/:sessionId/cookie', 'getAllCookies', {}],
    ['GET', '/session/:sessionId/cookie/:name', 'getNamedCookie', {}],
    ['POST', '/session/:sessionId/cookie', 'addCookie', {}],
    ['DELETE', '/session/:sessionId/cookie/:name', 'deleteCookie', {}],
    ['DELETE', '/session/:sessionId/cookie', 'deleteAllCookies', {}],

    ['POST', '/session/:sessionId/actions', 'performActions', {}],
    ['DELETE', '/session/:sessionId/actions', 'releaseActions', {}],

    ['POST', '/session/:sessionId/alert/dismiss', 'dismissAlert', {}],
    ['POST', '/session/:sessionId/alert/accept', 'acceptAlert', {}],
    ['GET', '/session/:sessionId/alert/text', 'getAlertText', {}],
    ['POST', '/session/:sessionId/alert/text', 'sendAlertText', {}],

    ['GET', '/session/:sessionId/screenshot', 'takeScreenshot', {}],
    ['GET', '/session/:sessionId/element/:elementId/screenshot', 'takeElementScreenshot', {}],
    ['POST', '/session/:sessionId/print', 'printPage', {}],

    ['POST', '/session/:sessionId/lumabyte/find', 'lumabyteFind', {}],
    ['POST', '/session/:sessionId/lumabyte/click', 'lumabyteClick', {}],
    ['POST', '/session/:sessionId/lumabyte/dom/snapshot', 'lumabyteDomSnapshot', {}],
    ['POST', '/session/:sessionId/lumabyte/cdp/execute', 'lumabyteCdpExecute', {}],
    ['POST', '/session/:sessionId/goog/cdp/execute', 'googCdpExecute', {}],
  ];

  static PARAM_ALIASES = { elementId: 'element id', shadowId: 'shadow id', propertyName: 'property name' };

  static remapParams(params) {
    const out = { ...params };
    for (const [expressName, specName] of Object.entries(WebDriverRouteTable.PARAM_ALIASES)) {
      if (expressName in out) out[specName] = out[expressName];
    }
    return out;
  }
}

module.exports = WebDriverRouteTable;
