"use strict";

const EXPORTED_SYMBOLS = ["load", "save", "put", "putGroup", "pop", "list", "count"];
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
  let tabItems = group.getChildren();
  let ntabs = tabItems.length;

  if (!confirm("Confirm Close All Tabs", `You are about to stash all tabs in group ${getGroupTitle(group)} (${ntabs} tab${ntabs > 0 ? 's' : ''}). Are you sure you want to continue?`))
    return;

  let stash = win.tabgroupsbtn.stash;

  if (typeof stash[groupId] === "undefined")
    stash[groupId] = {};
  let groupStash = stash[groupId];

  // collect the target first so that we can check if adding a blank tab is required
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

  // save stash first
  let now = Date.now();
  for (let tab of stashTarget)
    groupStash[getURL(win, tab)] = [tab.label, now];
  save(win);

  // then close the tabs
  for (let tab of stashTarget)
    win.gBrowser.removeTab(tab);
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
    if (groupStash !== undefined) {
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

function count(win, groupId) {
  if (win.tabgroupsbtn && win.tabgroupsbtn.stash) {
    let stash = win.tabgroupsbtn.stash[groupId];
    if (stash !== undefined) {
      return Object.keys(stash).length;
    }
  }
  return 0;
}
