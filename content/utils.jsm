"use strict";

let EXPORTED_SYMBOLS = [
  "getActiveWindow",
  // dom
  "createElement",
  "appendChild",
  "clearChildren",
  "clearPopup",
  "clearTabs",
  // dialog
  "prompt",
  "confirm",
  "alert",
  // status
  "isPending",
  "isBlank",
  "getURL",
  // link
  "openLinkInNewGroup",
  "openLinkInGroup",
  // tab
  "selectTab",
  "moveTabToGroup",
  "moveTabToNewGroup",
  //
  "registerPrefsObserver",
];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
const FM = Cc["@mozilla.org/focus-manager;1"].getService(Ci.nsIFocusManager);
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("chrome://tabgroupsbtn/content/addon.jsm");
Cu.import("chrome://tabgroupsbtn/content/tabgroups.jsm");
Cu.import("chrome://tabgroupsbtn/content/prefs.jsm");

function getActiveWindow() Services.wm.getMostRecentWindow("navigator:browser")

function createElement(doc, tag, attributes, eventhandlers, ...children) {
  let el = doc.createElement(tag);
  if (attributes) {
    for (let key in attributes) {
      let val = attributes[key];
      if (val !== undefined && val !== null)
        el.setAttribute(key, val);
    }
  }
  if (eventhandlers) {
    for (let event in eventhandlers) {
      let handler = eventhandlers[event];
      if (typeof handler === "function")
        el.addEventListener(event, handler);
    }
  }
  if (children) {
    for (let child of children)
      if (typeof child === "object")
        el.appendChild(child);
  }
  return el;
}

function appendChild(parent, ...children) {
  for (let child of children)
    parent.appendChild(child);
}

function prompt(title, text, value) {
  let ps = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
  let input = {value: value};
  let check = {value: false};
  if (ps.prompt(getActiveWindow(), title, text, input, null, check))
    return input.value; // "" if blank
}

function confirm(title, text) Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).confirm(getActiveWindow(), title, text)

function alert(title, text) Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).alert(getActiveWindow(), title, text)

function isPending(tab) tab.hasAttribute("pending")

function getURL(win, tab) win.gBrowser.getBrowserForTab(tab).currentURI.spec

function isBlank(win, tab) {
  let browser = win.gBrowser.getBrowserForTab(tab);
  if (! browser)
    return false;
  let uri = browser.currentURI.spec;
  return (uri == "about:blank" || uri == "about:newtab" || uri == "about:privatebrowsing") && browser.sessionHistory.count <= 1;
}

function clearChildren(parent) {
  while (true) {
    let child = parent.firstChild;
    if (child)
      parent.removeChild(child);
    else
      break;
  }
}

function clearPopup(popup) {
  clearChildren(popup);
}

function clearTabs(tabs) {
  clearChildren(tabs);
}

function openLinkInGroup(win, link, groupid) {
  selectGroup(win, groupid);

  let tb = win.gBrowser;
  tb.selectedTab = tb.addTab(link.href);
}

function openLinkInNewGroup(win, link) {
  selectGroup(win, getGroupItems(win).newGroup().id);
  win.gBrowser.loadURI(link.href);
}

function selectTab(win, tab) {
  win.gBrowser.selectedTab = tab;
}

function moveTabToGroup(win, tab, groupid, inBackground=false) {
  let activegroup = getActiveGroup(win);
  if (activegroup.getChildren().length == 1)
    activegroup.newTab();
  getGroupItems(win).moveTabToGroupItem(tab, groupid);
  if (! inBackground)
    selectTab(win, tab);
}

function moveTabToNewGroup(win, tab) {
  let GI = getGroupItems(win);
  let group = GI.newGroup();
  GI.moveTabToGroupItem(tab, group.id);
  selectGroup(win, group.id);
}

function registerPrefsObserver(observer) {
  prefBranch.addObserver("", observer, false);
  unload(() => prefBranch.removeObserver("", observer));
}
