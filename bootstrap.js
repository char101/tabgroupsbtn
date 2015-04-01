"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

let toolbar = {}, buttons = {}, window = {}, tabgroups = {}, prefs = {}, addon = {};

function processWindow(win) {
  logger.debug("processWindow");

  window.initState(win);

  toolbar.createToolbar(win);
  buttons.createContextMenu(win);
  toolbar.createContextMenu(win);

  window.addTabContextMenu(win);
  window.addLinkContextMenu(win);
  window.registerEventListeners(win);

  if (prefs.getPref("skip-pending"))
    addon.patchMethod(win.gBrowser, "_blurTab", [
      ["!aTab.owner.closing &&", "!aTab.owner.closing && !aTab.owner.hasAttribute('pending') &&"],
      ["if (!tab) {", "if (!tab || tab.hasAttribute('pending')) {"],
      ["this.selectedTab = tab;", "if (!tab || tab.hasAttribute('pending')) {\n" +
                                  "  tab = this.addTab();\n" +
                                  "  if (this.tabContainer.getIndexOfItem(aTab) < (this.tabs.length - 1))\n" +
                                  "    this.moveTabTo(tab, this.tabContainer.getIndexOfItem(aTab) + 1);\n" +
                                  "}\n" +
                                  "this.selectedTab = tab;"]
    ]);
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

// vim:set ts=2 sw=2 et:
