const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("resource:///modules/CustomizableUI.jsm");

(function(global) {
	global.include = function include(src) {
		var tools = {};
		Cu.import("resource://gre/modules/Services.jsm", tools);
		var baseURI = tools.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null);
		var uri = tools.Services.io.newURI("includes/" + src + ".js", null, tools.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null));
		tools.Services.scriptloader.loadSubScript(uri.spec, global);
	};
	var modules = {};
	global.require = function require(src) {
		if (modules[src])
			return modules[src];
		var scope = {require: global.require, Cu: global.Cu, Ci: global.Ci, Cc: global.Cc, exports: {}};
		var tools = {};
		Cu.import("resource://gre/modules/Services.jsm", tools);
		var baseURI = tools.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null);
		var uri = tools.Services.io.newURI("modules/" + src + ".js", null, baseURI);
		tools.Services.scriptloader.loadSubScript(uri.spec, scope);
		return modules[src] = scope.exports || scope.module.exports;
	};
})(this);

let {unload} = require("unload");
let {runOnLoad, runOnWindows, watchWindows} = require("window-utils");

include("prefs");
include("utils")
include("group")
include("tab")
include("link")
include("toolbar")
include("events")

function processWindow(win) {
	addTabContextMenu(win);
	addLinkContextMenu(win);
	addEventListener(win);
}

function install(data, reason) {}
function uninstall(data, reason) {
	if (reason == ADDON_UNINSTALL)
		prefBranch.deleteBranch("");
}
function startup(data, reason) {
	let ss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
	let ssuri = Services.io.newURI("chrome://tabgroupsbtn/content/style.css", null, null);
	ss.loadAndRegisterSheet(ssuri, ss.AUTHOR_SHEET);
	unload(() => ss.unregisterSheet(ssuri, ss.AUTHOR_SHEET));

	registerToolbarButtons();
	watchWindows(processWindow, "navigator:browser");
}
function shutdown(data, reason) unload();
