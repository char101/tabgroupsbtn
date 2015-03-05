"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");

const IS_LINUX = Services.appinfo.OS == 'Linux'; // Linux, WINNT, Mac?

let toolbar = {}, buttons = {}, window = {}, tabgroups = {}, firstWindow = true;

function processWindow(win) {
	toolbar.createToolbar(win);
	buttons.createContextMenu(win);
	toolbar.createContextMenu(win);

	if (IS_LINUX && firstWindow) {
		toolbar.manualRefresh(win);
	} else {
		tabgroups.initPanorama(win).then(() => {
			buttons.refresh(win);
			toolbar.refresh(win);
		});
	}

	window.addTabContextMenu(win);
	window.addLinkContextMenu(win);
	window.registerEventListeners(win);

	firstWindow = false;
}

function install(data, reason) {}
function uninstall(data, reason) {
	if (reason == ADDON_UNINSTALL)
		Services.prefs.getBranch("extensions.tabgroupsbtn.").deleteBranch("");
}
function startup(data, reason) {
	Cu.import("chrome://tabgroupsbtn/content/addon.jsm");
	Cu.import("chrome://tabgroupsbtn/content/toolbar.jsm", toolbar);
	Cu.import("chrome://tabgroupsbtn/content/buttons.jsm", buttons);
	Cu.import("chrome://tabgroupsbtn/content/window.jsm", window);
	Cu.import("chrome://tabgroupsbtn/content/tabgroups.jsm", tabgroups);

	let ss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
	let ssuri = Services.io.newURI("chrome://tabgroupsbtn/skin/style.css", null, null);
	ss.loadAndRegisterSheet(ssuri, ss.AUTHOR_SHEET);
	unload(() => ss.unregisterSheet(ssuri, ss.AUTHOR_SHEET));

	firstWindow = true;

	buttons.registerWidgets();
	toolbar.registerWidgets();
	watchWindows(processWindow, "navigator:browser");
}
function shutdown(data, reason) {
	unload();
	for (let module of ["addon", "prefs", "toolbar", "buttons", "window", "tabgroups", "utils", "ui"])
		Cu.unload(`chrome://tabgroupsbtn/content/${module}.jsm`);
}
