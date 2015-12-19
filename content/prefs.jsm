"use strict";

const EXPORTED_SYMBOLS = [
  "prefBranch",
  "getPref",
  "setPref",
  "setDefaultPrefs"
];

const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");

const PREF_BRANCH = "extensions.tabgroupsbtn.";
const PREFS = {
  "closebtn-disabled"  : false,
  "newbtn-disabled"    : false,
  "mouseover"          : false,
  "bar.button"         : true,
  "bar.position"       : "top-last",
  "bar.collapsed"      : false,
  "bar.no_separator"   : false,
  "bar.tabcount"       : false,
  "bar.tabcount-style" : "",
  "clean-empty-tabs"   : false,
  "skip-pending"       : false,
  "log-level"          : 60,
  "log-to-file"        : false,
  "stash"              : false,
  "stash-submenu-min"  : 0,
  "tabs-submenu-min"   : 0
}

const prefBranch = Services.prefs.getBranch(PREF_BRANCH);

function setDefaultPrefs() {
  let branch = Services.prefs.getDefaultBranch(PREF_BRANCH);
  for (let [k, v] in Iterator(PREFS)) {
    switch (typeof v) {
      case "boolean":
        branch.setBoolPref(k, v);
        break;
      case "number":
        branch.setIntPref(k, v);
        break;
      case "string":
        branch.setCharPref(k, v);
        break;
    }
  }
}

function getPref(key, defval=null) {
  switch (prefBranch.getPrefType(key)) {
    case prefBranch.PREF_STRING:
      return prefBranch.getCharPref(key);
    case prefBranch.PREF_BOOL:
      return prefBranch.getBoolPref(key);
    case prefBranch.PREF_INT:
      return prefBranch.getIntPref(key);
    case prefBranch.PREF_INVALID:
      if (PREFS.hasOwnProperty(key))
        return PREFS[key];
      console.log("tabgroupsbtn: Unknown preference: " + key);
      return undefined;
  }
}

function setPref(key, value) {
  switch (typeof value) {
    case "string":
      return prefBranch.setCharPref(key, value);
    case "boolean":
      return prefBranch.setBoolPref(key, value);
    case "number":
      return prefBranch.setIntPref(key, value);
  }
}
