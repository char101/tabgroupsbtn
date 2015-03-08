"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

const IS_LINUX = Services.appinfo.OS == 'Linux'; // Linux, WINNT, Mac?

let toolbar = {}, buttons = {}, window = {}, tabgroups = {}, prefs = {}, addon = {}, firstWindow = true;

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

	window.initState(win);
	window.addTabContextMenu(win);
	window.addLinkContextMenu(win);
	window.registerEventListeners(win);

	if (prefs.getPref("skip-pending"))
		addon.patchMethod(win.gBrowser, "_blurTab", "this.selectedTab = tab;", "this.selectedTab = tab.hasAttribute('pending') ? this.addTab() : tab;");

	firstWindow = false;
}

function install(data, reason) {}
function uninstall(data, reason) {
	if (reason == ADDON_UNINSTALL)
		Services.prefs.getBranch("extensions.tabgroupsbtn.").deleteBranch("");
}
function startup(data, reason) {
	Cu.import("chrome://tabgroupsbtn/content/log.jsm");
	logger.info("startup", reason);

	Cu.import("chrome://tabgroupsbtn/content/addon.jsm", addon);
	Cu.import("chrome://tabgroupsbtn/content/prefs.jsm", prefs);
	Cu.import("chrome://tabgroupsbtn/content/toolbar.jsm", toolbar);
	Cu.import("chrome://tabgroupsbtn/content/buttons.jsm", buttons);
	Cu.import("chrome://tabgroupsbtn/content/window.jsm", window);
	Cu.import("chrome://tabgroupsbtn/content/tabgroups.jsm", tabgroups);

	firstWindow = true;

	addon.addStylesheet("style.css");
	toolbar.registerWidgets();
	buttons.registerWidgets();

	addon.watchWindows(processWindow, "navigator:browser");
}
function shutdown(data, reason) {
	logger.info("shutdown", reason);

	if (reason == APP_SHUTDOWN)
		return;

	addon.unload();
	for (let module of ["addon", "prefs", "toolbar", "buttons", "window", "tabgroups", "utils", "ui", "log"])
		Cu.unload(`chrome://tabgroupsbtn/content/${module}.jsm`);
}
