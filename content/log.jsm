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
