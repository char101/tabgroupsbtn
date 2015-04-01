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

// from Console.jsm
function fmt(aStr, aMaxLen, aMinLen, aOptions) {
  if (aMinLen == null) {
    aMinLen = aMaxLen;
  }
  if (aStr == null) {
    aStr = "";
  }
  if (aStr.length > aMaxLen) {
    if (aOptions && aOptions.truncate == "start") {
      return "_" + aStr.substring(aStr.length - aMaxLen + 1);
    }
    else if (aOptions && aOptions.truncate == "center") {
      let start = aStr.substring(0, (aMaxLen / 2));

      let end = aStr.substring((aStr.length - (aMaxLen / 2)) + 1);
      return start + "_" + end;
    }
    else {
      return aStr.substring(0, aMaxLen - 1) + "_";
    }
  }
  if (aStr.length < aMinLen) {
    let padding = Array(aMinLen - aStr.length + 1).join(" ");
    aStr = (aOptions.align === "end") ? padding + aStr : aStr + padding;
  }
  return aStr;
}


// from Console.jsm
function formatTrace(aTrace) {
  let reply = "";
  aTrace.forEach(function(frame) {
    if (frame.filename)
      reply += frame.filename + ":" + fmt(frame.lineNumber, 5, 5) + " " + frame.functionName + "\n";
  });
  return reply;
}

// from Console.jsm
function getStack(aFrame, aMaxDepth = 0) {
  if (!aFrame) {
    aFrame = Components.stack.caller;
  }
  let trace = [];
  while (aFrame) {
    trace.push({
      filename: aFrame.filename,
      lineNumber: aFrame.lineNumber,
      functionName: aFrame.name,
      language: aFrame.language,
    });
    if (aMaxDepth == trace.length) {
      break;
    }
    aFrame = aFrame.caller;
  }
  return trace;
}

let originalTrace = logger.trace.bind(logger);

// override trace method to add stack trace
logger.trace = function(text, params) {
    let trace = getStack(Components.stack.caller);
    originalTrace(text + "\n" + formatTrace(trace), params);
}

// vim:set ts=2 sw=2 et:
