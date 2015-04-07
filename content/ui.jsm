"use strict";

const EXPORTED_SYMBOLS = [
  "showGroupContextMenu",
];

const Cu = Components.utils;
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("chrome://tabgroupsbtn/content/prefs.jsm");
Cu.import("chrome://tabgroupsbtn/content/relativetime.jsm");
Cu.import("chrome://tabgroupsbtn/content/tabgroups.jsm");
Cu.import("chrome://tabgroupsbtn/content/utils.jsm");
Cu.import("chrome://tabgroupsbtn/content/window.jsm");
const Stash = Cu.import("chrome://tabgroupsbtn/content/stash.jsm", {});

function showMergeMenu(popup, groupid) {
  let win = getActiveWindow();
  let doc = win.document;

  clearPopup(popup);

  for (let gr of getGroupList(win)) {
    let [id, title, active, group] = gr;
    popup.appendChild(createElement(doc, "menuitem", {
      label: title,
      disabled: id == groupid,
      class: active ? "tabgroupsbtn-btn-active" : ""
    }, {
      command: e => mergeGroup(win, groupid, id)
    }));
  }
}

function onTabClick(event, win, tab) {
  if (event.button === 1) {
    // handle middle click: close tab
    let menuitem = event.target;
    if (menuitem.disabled)
      return;

    // set menuitem disabled
    menuitem.disabled = true;
    menuitem.classList.add("tabgroupsbtn-tab-closed");

    // close tab
    win.gBrowser.removeTab(tab);
  }
}

function showGroupContextMenu(popup, groupid=null) {
  let win = getActiveWindow();
  let doc = win.document;
  groupid = groupid || popup.parentNode.getAttribute("value");
  if (! groupid)
    return;
  let group = getGroup(win, groupid);

  clearPopup(popup);

  let tabItems = group.getChildren();

  let tabsSubmenuMin = getPref("tabs-submenu-min");
  let parent = null;
  if (tabsSubmenuMin > 0 && tabItems.length >= tabsSubmenuMin) {
    let tabsMenu = createElement(doc, "menu", {label: `Tabs (${tabItems.length})`});
    let tabsPopup = createElement(doc, "menupopup");
    tabsMenu.appendChild(tabsPopup);
    popup.appendChild(tabsMenu)
    parent = tabsPopup;
  } else {
    popup.appendChild(createElement(doc, "menuitem", {label: "TABS", disabled: true}));
    parent = popup;
  }

  // items in group
  for (let i = 0, n = tabItems.length; i < n; ++i) {
    let tab = tabItems[i].tab;
    let mi = createElement(doc, "menuitem", {
      value: `${groupid}.${i}`,
      label: tab.label,
      image: tab.image,
      class: "menuitem-iconic" + (tab.hasAttribute("pending") ? " tabgroupsbtn-btn-pending" : "")
    }, {
      command: e => selectTab(win, tab),
      click: e => onTabClick(e, win, tab)
    });
    parent.appendChild(mi);
  }

  if (getPref("stash")) {
    // stashed urls
    let stash = Stash.list(win, groupid);
    if (stash !== undefined && stash.length > 0) {
      popup.appendChild(createElement(doc, "menuseparator"));

      let stashSubmenuMin = getPref("stash-submenu-min");
      let parent = null;
      if (stashSubmenuMin > 0 && stash.length >= stashSubmenuMin) {
        let stashMenu = createElement(doc, "menu", {label: `Stash (${stash.length})`});
        let stashPopup = createElement(doc, "menupopup");
        stashMenu.appendChild(stashPopup);
        popup.appendChild(stashMenu);
        parent = stashPopup;
      } else {
        parent = popup;
        popup.appendChild(createElement(doc, "menuitem", {label: "STASH", disabled: true}));
      }

      let now = new Date();
      for (let i = 0, n = stash.length; i < n; ++i) {
        let [label, url, ts] = stash[i];
        let mi = createElement(doc, "menuitem", {
          label: label,
          tooltiptext: url,
          acceltext: toRelativeTime(new Date(ts), {now: now})
        }, {
          command: e => Stash.pop(win, groupid, url)
        });
        parent.appendChild(mi);
      }
    }
  }

  // group operations
  popup.appendChild(createElement(doc, "menuseparator"));
  popup.appendChild(createElement(doc, "menuitem", {
    label: "Rename"
  }, {
    command: e => renameGroup(null, groupid)
  }));

  if (getGroupCount(win) > 1) {
    popup.appendChild(createElement(doc, "menuitem", {
      label: "Close"
    }, {
      command: e => closeGroup(null, groupid, true)
    }));

    let mergePopup = createElement(doc, "menupopup", null, {popupshowing: e => {
      e.stopPropagation();
      showMergeMenu(e.target, groupid);
    }});
    popup.appendChild(createElement(doc, "menu", {
      label: "Merge To...",
    }, null, mergePopup));
  }

  popup.appendChild(createElement(doc, "menuitem", {
    label: "Close All Tabs"
  }, {
    command: e => {
      clearGroup(null, groupid);
      cleanEmptyTabs();
    }
  }));

  let isActive = groupid == getActiveGroup(win).id;

  if (isActive && getPref("stash")) {
    let mi = createElement(doc, "menuitem", {label: "Stash All Tabs"}, {command: e => Stash.putGroup(win, groupid)});
    popup.appendChild(mi);
  }
}
