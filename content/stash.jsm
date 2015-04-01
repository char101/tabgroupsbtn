"use strict";

const EXPORTED_SYMBOLS = ["load", "save", "put", "putGroup", "pop", "list"];
const KEY = "tabgroupsbtn-stash";
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const SessionStore = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
Cu.import("chrome://tabgroupsbtn/content/addon.jsm");
Cu.import("chrome://tabgroupsbtn/content/log.jsm");
Cu.import("chrome://tabgroupsbtn/content/tabgroups.jsm");
Cu.import("chrome://tabgroupsbtn/content/utils.jsm");

function load(win) {
  if (win.tabgroupsbtn) {
    win.tabgroupsbtn.stash = {};

    let str = SessionStore.getWindowValue(win, KEY);
    if (str != "") {
      let stash = JSON.parse(str);
      if (typeof stash === "object" && !Array.isArray(stash))
        win.tabgroupsbtn.stash = stash;
    }
  }
}

function save(win) {
  if (win.tabgroupsbtn && win.tabgroupsbtn.stash)
    SessionStore.setWindowValue(win, KEY, JSON.stringify(win.tabgroupsbtn.stash));
}

function put(win, tab) {
  if (win.tabgroupsbtn) {
    initPanorama(win).then(() => {
      let url = getURL(win, tab);
      let stash = win.tabgroupsbtn.stash;
      let groupId = getActiveGroup(win).id;

      logger.info("Stashing " + url);
      logger.info("Stash = " + JSON.stringify(win.tabgroupsbtn.stash));

      if (typeof stash[groupId] === "undefined")
        stash[groupId] = {};

      stash[groupId][url] = [tab.label, Date.now()];
      save(win);

      win.gBrowser.removeTab(tab);
    });
  }
}

function putGroup(win, groupId) {
  let group = getGroup(win, groupId);

  let stash = win.tabgroupsbtn.stash;
  if (typeof stash[groupId] === "undefined")
    stash[groupId] = {};

  let groupStash = stash[groupId];

  let tabItems = group.getChildren();

  let stashTarget = [];
  for (let ti of tabItems) {
    let tab = ti.tab;
    if (isBlank(win, tab))
      continue;
    stashTarget.push(tab);
  }

  // add a blank tab to prevent all tabs being closed
  if (stashTarget.length == tabItems.length)
    win.gBrowser.addTab();

  let now = Date.now();
  for (let tab of stashTarget) {
    let url = getURL(win, tab);
    groupStash[url] = [tab.label, now];
    win.gBrowser.removeTab(tab);
  }

  save(win);
}

function pop(win, groupid, url) {
    selectGroup(win, groupid);
    win.gBrowser.loadOneTab(url, {inBackground: false});
    delete win.tabgroupsbtn.stash[groupid][url];
    save(win);
    triggerEvent("tabgroupsbtn-tabselect");
}

function list(win, groupId) {
  if (win.tabgroupsbtn && win.tabgroupsbtn.stash) {
    let stash = win.tabgroupsbtn.stash;
    let groupStash = stash[groupId];
    if (typeof groupStash !== "undefined") {
      let urls = [];
      for (let url in groupStash) {
        let [label, ts] = groupStash[url];
        urls.push([label, url, ts]);
      }
      // sort by newest to oldest
      urls.sort((a, b) => b[2] - a[2]);
      return urls;
    }
  }
}
