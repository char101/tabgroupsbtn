"use strict";

let EXPORTED_SYMBOLS = [
	"prefBranch",
	"getPref",
	"setPref",
	"registerPrefsObserver"
];

const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("chrome://tabgroupsbtn/content/addon.jsm");

let prefBranch = Services.prefs.getBranch("extensions.tabgroupsbtn.");

function getPref(key, defval=null) {
	switch (prefBranch.getPrefType(key)) {
		case prefBranch.PREF_STRING:
			return prefBranch.getCharPref(key);
		case prefBranch.PREF_BOOL:
			return prefBranch.getBoolPref(key);
		case prefBranch.PREF_INT:
			return prefBranch.getIntPref(key);
		case prefBranch.PREF_INVALID:
			switch (key) {
				case "closebtn-disabled": return false;
				case "newbtn-disabled": return false;
				case "mouseover": return false;
				case "bar.button": return false;
				case "bar.position": return "top-last";
				case "clean-empty-tabs": return false;
				case "skip-pending": return false;
				default:
					console.log("tabgroupsbtn: Unknown preference: " + key);
					return undefined;
			}
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

function registerPrefsObserver(observer) {
	prefBranch.addObserver("", observer, false);
	unload(() => prefBranch.removeObserver("", observer));
}