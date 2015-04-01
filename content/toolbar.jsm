"use strict";

const EXPORTED_SYMBOLS = [
  "refresh",
  "manualRefresh",
  "createToolbar",
  "registerWidgets",
  "createContextMenu",
];

const Cu = Components.utils;
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("resource:///modules/CustomizableUI.jsm");
Cu.import("chrome://tabgroupsbtn/content/addon.jsm");
Cu.import("chrome://tabgroupsbtn/content/utils.jsm");
Cu.import("chrome://tabgroupsbtn/content/tabgroups.jsm");
Cu.import("chrome://tabgroupsbtn/content/prefs.jsm");
Cu.import("chrome://tabgroupsbtn/content/ui.jsm");
Cu.import("chrome://tabgroupsbtn/content/log.jsm");

function clearToolbarSelectedState(container) {
  let children = container.children;
  if (! getPref("bar.button")) {
    for (let i = 0, n = children.length; i < n; ++i) {
      let tab = children[i];
      if (tab.selected)
        tab.setAttribute("selected", false);
    }
  } else {
    for (let i = 0, n = children.length; i < n; ++i) {
      let btn = children[i];
      if (btn.checked)
        btn.checked = false;
    }
  }
}

function createContextMenu(win) {
  let doc = win.document;
  let popupset = doc.getElementById("mainPopupSet");

  let context = createElement(doc, "menupopup", {id: "tabgroupsbtn-bar-context"}, {popupshowing: event => showGroupContextMenu(event.target, event.target.triggerNode.getAttribute("value"))});
  popupset.appendChild(context);
  unload(() => popupset.removeChild(context));

  let toolbarContext = createElement(doc, "menupopup", {id: "tabgroupsbtn-bar-toolbar-context"});
  toolbarContext.appendChild(createElement(doc, "menuitem", {label: "New Group"}, {command: event => promptCreateGroup(win)}));
  popupset.appendChild(toolbarContext);
  unload(() => popupset.removeChild(toolbarContext));
}

function getTooltipText(group) {
  let tabitems = group.getChildren();
  let ntabs = tabitems.length;
  let tooltip = `[${ntabs} tab` + (ntabs > 1 ? "s" : "") + "]\n";
  let limit = 25;
  for (let i = 0, n = Math.min(limit, ntabs); i < n; ++i) {
    let tab = tabitems[i].tab;
    tooltip += `${tab.label}\n`;
  }
  if (ntabs > limit) {
    tooltip += "...";
  }
  return tooltip;
}

function refresh(win=null) {
  //logger.debug("toolbar:refresh");
  if (win === null)
    win = getActiveWindow();
  let doc = win.document;
  let items = doc.getElementById("tabgroupsbtn-bar-items");
  if (! items)
    return;
  initPanorama(win).then(() => {
    let groups = getGroupList(win, true);

    if (! getPref("bar.button")) {
      clearTabs(items);

      for (let gr of groups) {
        let [id, title, active, group] = gr;
        let tab = createElement(doc, "tab", {
          id: "tabgroupsbtn-bar-tab-" + id,
          label: title,
          selected: active,
          value: id,
          context: "tabgroupsbtn-bar-context",
          tooltiptext: getTooltipText(group)
        }, {
          command: e => {
            clearToolbarSelectedState(items);
            tab.setAttribute("selected", true);
            selectGroup(win, id);
          }
        });
        items.appendChild(tab);
      }
    } else {
      clearChildren(items);

      for (let i = 0, n = groups.length; i < n; ++i) {
        let [id, title, active, group] = groups[i];
        let btn = createElement(doc, "toolbarbutton", {
          type: "checkbox",
          class: "toolbarbutton-1 chromeclass-toolbar-additional tabgroupsbtn-bar-button",
          label: title,
          value: id,
          context: "tabgroupsbtn-bar-context",
          tooltiptext: getTooltipText(group)
        }, {
          command: e => {
            clearToolbarSelectedState(items);
            btn.checked = true;
            selectGroup(win, id);
          }
        });
        items.appendChild(btn);
        if (active)
          btn.checked = true;

        if (i < n - 1)
          items.appendChild(createElement(doc, "toolbarseparator", {class: "tabgroupsbtn-bar-separator"}));
      }
    }
  });
}

function registerWidgets() {
  CustomizableUI.createWidget({
    id: "tabgroupsbtn-bar",
    type: "custom",
    label: "Tab Groups Button (Bar)",
    tooltiptext: "Tab Groups Button (Bar)",
    onBuild: function(doc) {
      let ti = createElement(doc, "toolbaritem", {
        id: "tabgroupsbtn-bar",
        flex: 1,
        mousethrough: "always",
      });

      let btn = createElement(doc, "toolbarbutton", {
        id: "tabgroupsbtn-bar-manual-button",
        class: "toolbarbutton-1 tabgroupsbtn-bar-manual",
        label: "Load Panorama",
      });
      btn.addEventListener("command", e => {
        ti.removeChild(btn);
        refresh();
      }, false);
      ti.insertBefore(btn, ti.firstChild);

      let placeholder = createElement(doc, "toolbarbutton", {
        id: "tabgroupsbtn-bar-placeholder",
        class: "toolbarbutton-1",
        label: "TabGroupsBtn:Bar",
      });
      ti.appendChild(placeholder);

      let container = createElement(doc, "hbox", {
        id: "tabgroupsbtn-bar-container",
        allowevents: true,
        flex: 1,
        mousethrough: "always"
      });
      ti.appendChild(container);

      if (! getPref("bar.button")) {
        // let tabbox = createElement(doc, "tabbox", {
        //  id: "tabgroupsbtn-bar-tabbox",
        //  flex: 1
        // });
        // container.appendChild(tabbox);

        let tabs = createElement(doc, "tabs", {
          id: "tabgroupsbtn-bar-tabs",
          flex: 1
        });
        container.appendChild(tabs);

        let scroll = createElement(doc, "arrowscrollbox", {
          id: "tabgroupsbtn-bar-items",
          smoothscroll: true,
          allowevents: true,
          clicktoscroll: true,
          flex: 1,
          orient: "horizontal",
        });
        tabs.appendChild(scroll);
      } else {
        let scroll = createElement(doc, "arrowscrollbox", {
          id: "tabgroupsbtn-bar-items",
          smoothscroll: true,
          allowevents: true,
          clicktoscroll: true,
          flex: 1,
          orient: "horizontal"
        });
        container.appendChild(scroll);
      }

      return ti;
    }
  });
  unload(() => CustomizableUI.destroyWidget("tabgroupsbtn-bar"));

  CustomizableUI.registerArea("tabgroupsbtn-bar-toolbar", {
    type: CustomizableUI.TYPE_TOOLBAR,
    defaultPlacements: ["tabgroupsbtn-bar"]
  });
  unload(() => {
    logger.info("unload: CustomizableUI.unregisterArea(tabgroupsbtn-bar-toolbar)");
    CustomizableUI.unregisterArea("tabgroupsbtn-bar-toolbar");
  });

  let listener = {
    onWidgetAdded: (widget, area, position) => {
      let win = getActiveWindow();
      if (win && win.tabgroupsbtn && win.tabgroupsbtn.panoramaLoaded)
        refresh(win);
    },
  };
  CustomizableUI.addListener(listener);
  unload(() => CustomizableUI.removeListener(listener));
}

function setToolbarStyle(win, inTop) {
  let doc = win.document;
  let toolbar = doc.getElementById("tabgroupsbtn-bar-toolbar");
  if (! toolbar)
    return;
  let tabstoolbar = doc.getElementById("TabsToolbar");

  if (inTop) {
    toolbar.classList.add("tabgroupsbtn-bar-toolbar-transparent");
    if (tabstoolbar) {
      tabstoolbar.classList.add("tabstoolbar-nomargin");
      unload(() => el.classList.remove("tabstoolbar-nomargin"));
    }

    // if menubar is not visible then the toolbar is in the titlebar row, add padding to accomodate window buttons
    let menubar = doc.getElementById("toolbar-menubar");
    if (menubar.getAttribute("inactive") === "true") {
      let buttonbox = doc.getElementById("titlebar-buttonbox-container");
      if (win.getComputedStyle(buttonbox, null).display !== "none") {
        toolbar.classList.add("tabgroupsbtn-bar-toolbar-windowbuttons");
      }
    }
  } else {
    toolbar.classList.remove("tabgroupsbtn-bar-toolbar-transparent");
    toolbar.classList.remove("tabgroupsbtn-bar-toolbar-windowbuttons");
    if (tabstoolbar)
      tabstoolbar.classList.remove("tabstoolbar-nomargin");
  }
}

function positionToolbar(win, toolbar=null) {
  let doc = win.document;
  if (toolbar === null)
    toolbar = doc.getElementById("tabgroupsbtn-bar-toolbar");
  if (! toolbar)
    return;

  let position = getPref("bar.position");
  let done = false;
  switch (position) {
    case "top-last":
      doc.getElementById("navigator-toolbox").appendChild(toolbar);
      setToolbarStyle(win, false);
      done = true;
      break;
    case "bottom-first":
      let parent = doc.getElementById("browser-bottombox");
      parent.insertBefore(toolbar, parent.firstChild);
      setToolbarStyle(win, false);
      done = true;
      break;
    case "bottom-last":
      doc.getElementById("browser-bottombox").appendChild(toolbar);
      setToolbarStyle(win, false);
      done = true;
      break;
    default:
      if (position) {
        let pos = "before";
        let id = position;

        let parts = position.split("|");
        if (parts.length == 2)
          [pos, id] = parts;

        let el = doc.getElementById(id);
        if (el) {
          if (pos == "after") {
            el.parentNode.insertBefore(toolbar, el.nextSibling);
            done = true;
          } else if (pos == "before") {
            el.parentNode.insertBefore(toolbar, el);
            done = true;
          }
          setToolbarStyle(win, id == "TabsToolbar" && pos == "before");
        }

      }
  }

  if (! done)
    doc.getElementById("navigator-toolbox").insertBefore(toolbar, doc.getElementById("TabsToolbar"));
}

function observeToolbarChange(win, id) {
  logger.info("observeToolbarChange");
  let doc = win.document;
  let el = doc.getElementById(id);
  if (el) {
    let observer = new win.MutationObserver(mutations => {
      if (! mutations.length)
        return;
      logger.info("mutation observed at", element);
      let toolbar = doc.getElementById("tabgroupsbtn-bar");
      if (toolbar) {
        setPref("bar.collapsed", toolbar.collapsed);
        logger.info("observeToolbarChange: toolbar.collapsed =", toolbar.collapsed);
      }
    });
    observer.observe(el, {childList: true});
    unload(() => observer.disconnect());
  } else {
    logger.info("observeToolbarChange:", id, "not found");
  }
}

function createToolbar(win) {
  let doc = win.document;
  let toolbar = createElement(doc, "toolbar", {
    id: "tabgroupsbtn-bar-toolbar",
    class: "toolbar-primary chromeclass-toolbar",
    toolbarname: "Tab Groups Button",
    defaultset: "tabgroupsbtn-bar,tabgroupsbtn-btn",
    hidden: false,
    mode: "full", // icons/text/null
    iconsize: "small",
    customizable: true,
    context: "tabgroupsbtn-bar-toolbar-context"
  });
  toolbar.collapsed = getPref("bar.collapsed");

  let observer = new win.MutationObserver(mutations => {
    if (! mutations.length)
      return;
    for (let m of mutations) {
      if (m.attributeName == "collapsed") {
        setPref("bar.collapsed", toolbar.collapsed);
        logger.info("observeToolbarChange: toolbar.collapsed =", toolbar.collapsed);
        break;
      }
    }
  });
  observer.observe(toolbar, {attributes: true});
  unload(() => observer.disconnect());

  positionToolbar(win, toolbar);

  unload(() => {
    let tb = doc.getElementById("tabgroupsbtn-bar-toolbar");
    if (tb)
      tb.remove();
  });
}

let prefObserver = {
  observe: function observe(subject, topic, data) {
    switch (data) {
      case "bar.position":
        runOnWindows((win) => positionToolbar(win));
        break;
    }
  }
};
registerPrefsObserver(prefObserver);
