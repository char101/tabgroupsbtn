"use strict";

let EXPORTED_SYMBOLS = [
  "logger"
];

const Cu = Components.utils;
const Ci = Components.interfaces;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Log.jsm");
Cu.import("chrome://tabgroupsbtn/content/prefs.jsm");

let logger = Log.repository.getLogger("tabgroupsbtn");
logger.level = getPref("log-level");
let formatter = new Log.BasicFormatter();
if (getPref("log-to-file")) {
  let logfile = Services.dirsvc.get("TmpD", Ci.nsIFile);
  logfile.append("tabgroupsbtn.log");
  logger.addAppender(new Log.FileAppender(logfile.path, formatter));
} else {
  logger.addAppender(new Log.ConsoleAppender(formatter));
}

logger.trace = function(text, params) {
  let trace = "";
  if (typeof Components !== "undefined") {
    trace = "\n";
    let frame = Components.stack.caller;
    while (frame) {
      let file = frame.filename || frame.fileName;
      if (file)
        trace += `${file}:${frame.lineNumber} ${frame.name}\n`;
      frame = frame.caller;
    }
  }
  Log.Logger.prototype.trace.call(logger, text + trace, params);
}

// vim:set ts=2 sw=2 et:
