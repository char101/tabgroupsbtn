"use strict";

const EXPORTED_SYMBOLS = [
  "showGroupContextMenu",
];

const Cu = Components.utils;
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("chrome://tabgroupsbtn/content/utils.jsm");
Cu.import("chrome://tabgroupsbtn/content/tabgroups.jsm");
Cu.import("chrome://tabgroupsbtn/content/relativetime.jsm");
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

function showGroupContextMenu(popup, groupid=null) {
  let win = getActiveWindow();
  let doc = win.document;
  groupid = groupid || popup.parentNode.getAttribute("value");
  if (! groupid)
    return;
  let group = getGroup(win, groupid);

  clearPopup(popup);

  // items in group
  for (let ti of group.getChildren()) {
    let tab = ti.tab;
    let mi = createElement(doc, "menuitem", {
        label: tab.label,
        image: tab.image,
        class: "menuitem-iconic" + (tab.hasAttribute("pending") ? " tabgroupsbtn-btn-pending" : "")
      }, {
        command: e => selectTab(win, tab)
      }
    );
    popup.appendChild(mi);
  }

  // stashed urls
  let stash = Stash.list(win, groupid);
  if (stash !== undefined && stash.length > 0) {
    popup.appendChild(createElement(doc, "menuseparator"));
    popup.appendChild(createElement(doc, "menuitem", {label: "Stashed URLs", disabled: true}));

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
      popup.appendChild(mi);
    }
  }

  // group operations
  popup.appendChild(createElement(doc, "menuseparator"));
  popup.appendChild(createElement(doc, "menuitem", {label: "Rename Group"}, {
    command: e => renameGroup(null, groupid)
  }));

  if (getGroupCount(win) > 1) {
    let mergePopup = createElement(doc, "menupopup", null, {popupshowing: e => {
      e.stopPropagation();
      showMergeMenu(e.target, groupid);
    }});
    popup.appendChild(createElement(doc, "menu", {
      label: "Merge Group",
    }, null, mergePopup));

    popup.appendChild(createElement(doc, "menuitem", {
      label: "Close Group"
    }, {
      command: e => closeGroup(null, groupid, true)
    }));
  }

  let isActive = groupid == getActiveGroup(win).id;

  if (isActive) {
    let mi = createElement(doc, "menuitem", {label: "Stash"}, {command: e => Stash.putGroup(win, groupid)});
    popup.appendChild(mi);
  }
}
