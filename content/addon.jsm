const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("chrome://tabgroupsbtn/content/log.jsm");

let EXPORTED_SYMBOLS = [
  "unload",
  "runOnLoad",
  "runOnWindows",
  "watchWindows",
  "patchMethod",
  "replaceMethod",
  "addStylesheet",
  "listen",
  "triggerEvent",
  "observe",
];

function unload(callback, container) {
  // Initialize the array of unloaders on the first usage
  let unloaders = unload.unloaders;
  if (unloaders === undefined)
    unloaders = unload.unloaders = [];

  // Calling with no arguments runs all the unloader callbacks
  if (callback === undefined) {
    unloaders.slice().forEach(f => {
      logger.debug("unload:", f.callback.toString());
      f();
    });
    unloaders.length = 0;
    return;
  }

  // The callback is bound to the lifetime of the container if we have one
  if (container !== undefined) {
    // Remove the unloader when the container unloads
    container.addEventListener("unload", unloader, false);

    // Wrap the callback to additionally remove the unload listener
    let origCallback = callback;
    callback = function() {
      container.removeEventListener("unload", unloader, false);
      removeUnloader();
      origCallback();
    };
  }

  // Wrap the callback in a function that ignores failures
  function unloader() {
    try {
      callback();
    } catch (ex) {
      console.exception(ex);
      logger.error(ex);
    }
  }
  unloader.callback = callback;
  unloaders.push(unloader);

  // Provide a way to remove the unloader
  function removeUnloader() {
    let index = unloaders.indexOf(unloader);
    if (index != -1)
      unloaders.splice(index, 1);
  }
  return removeUnloader;
}

function runOnLoad(window, callback, winType) {
  // Listen for one load event before checking the window type
  window.addEventListener("load", function() {
    window.removeEventListener("load", arguments.callee, false);

    // Now that the window has loaded, only handle browser windows
    if (window.document.documentElement.getAttribute("windowtype") == winType)
      callback(window);
  }, false);
}


function runOnWindows(callback, winType=null) {
  if (winType === null)
    winType = "navigator:browser";

  // Wrap the callback in a function that ignores failures
  function watcher(window) {
    try {
      callback(window);
    } catch (ex) {
      console.exception(ex);
      logger.error(ex);
    }
  }

  // Add functionality to existing windows
  let browserWindows = Services.wm.getEnumerator(winType);
  while (browserWindows.hasMoreElements()) {
    // Only run the watcher immediately if the browser is completely loaded
    let browserWindow = browserWindows.getNext();
    if (browserWindow.document.readyState == "complete")
      watcher(browserWindow);
    // Wait for the window to load before continuing
    else
      runOnLoad(browserWindow, watcher, winType);
  }
}

function watchWindows(callback, winType) {
  // Wrap the callback in a function that ignores failures
  function watcher(window) {
    try {
      callback(window);
    }
    catch (ex) {
      console.exception(ex);
      logger.error(ex);
    }
  }

  // Add functionality to existing windows
  runOnWindows(callback, winType);

  // Watch for new browser windows opening then wait for it to load
  function windowWatcher(subject, topic) {
    if (topic == "domwindowopened")
      runOnLoad(subject, watcher, winType);
  }
  Services.ww.registerNotification(windowWatcher);

  // Make sure to stop watching for windows if we're unloading
  unload(function() Services.ww.unregisterNotification(windowWatcher));
}

function addStylesheet(filename) {
  let ss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
  let uri = Services.io.newURI("chrome://tabgroupsbtn/skin/" + filename, null, null);
  ss.loadAndRegisterSheet(uri, ss.AUTHOR_SHEET);
  unload(() => ss.unregisterSheet(uri, ss.AUTHOR_SHEET));
}


function listen(element, event, handler, capture=false) {
  element.addEventListener(event, handler, capture);
  unload(() => element.removeEventListener(event, handler, capture));
}

function triggerEvent(win, event) {
  win.dispatchEvent(new win.CustomEvent(event));
}

function observe(topic, func) {
  let observer = {observe: func};
  Services.obs.addObserver(observer, topic, false);
  unload(() => Services.obs.removeObserver(observer, topic));
}

function patchMethod(obj, method, search, replace) {
  let origCode = obj[method].toString();

  let replacements = Array.isArray(search) ? search : [[search, replace]];
  let code = origCode;
  for (let [s, r] of replacements)
    code = code.replace(s, r);

  if (origCode == code)
    return;
  logger.info("Patching method " + method + " of " + obj);
  logger.info(code);
  code = "(" + code + ")";

  if (! obj.hasOwnProperty(method)) {
    Object.defineProperty(obj, method, {value: eval(code), writable: true, configurable: true});
    unload(() => {
      delete obj[method];
    });
  } else {
    obj[method] = eval(code);
    unload(() => obj[method] = eval(origCode));
  }
}

function replaceMethod(obj, method, code) {
  let origCode = obj[method].toString();

  logger.info("Replacing method " + method + " of " + obj);
  logger.info(origCode);
  logger.info(code);
  code = "(" + code + ")";

  if (! obj.hasOwnProperty(method)) {
    Object.defineProperty(obj, method, {value: eval(code), writable: true, configurable: true});
    unload(() => {
      delete obj[method];
    });
  } else {
    obj[method] = eval(code);
    unload(() => obj[method] = eval(origCode));
  }
}
