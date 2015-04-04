"use strict";

const {utils: Cu, classes: Cc, interfaces: Ci} = Components;
Cu.import("resource://gre/modules/Services.jsm");

const Addon = {}, Buttons = {}, Toolbar = {}, Window = {};

function processWindow(win) {
  Cu.import("chrome://tabgroupsbtn/content/log.jsm");
  logger.debug("processWindow");

  Window.initState(win);

  Toolbar.createToolbar(win);
  Buttons.createContextMenu(win);
  Toolbar.createContextMenu(win);

  Window.registerEventListeners(win);

  if (prefs.getPref("skip-pending"))
    Addon.patchMethod(win.gBrowser, "_blurTab", [
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

  Cu.import("chrome://tabgroupsbtn/content/addon.jsm", Addon);
  Cu.import("chrome://tabgroupsbtn/content/toolbar.jsm", Toolbar);
  Cu.import("chrome://tabgroupsbtn/content/buttons.jsm", Buttons);
  Cu.import("chrome://tabgroupsbtn/content/window.jsm", Window);

  Addon.addStylesheet("style.css");
  Toolbar.registerWidgets();
  Buttons.registerWidgets();

  Addon.watchWindows(processWindow, "navigator:browser");
}

function shutdown(data, reason) {
  Cu.import("chrome://tabgroupsbtn/content/log.jsm");
  logger.info("shutdown", reason);

  if (reason == APP_SHUTDOWN)
    return;

  Addon.unload();
  for (let module of ["addon", "prefs", "toolbar", "buttons", "window", "tabgroups", "utils", "ui", "log", "stash", "relativetime"])
    Cu.unload(`chrome://tabgroupsbtn/content/${module}.jsm`);
}
