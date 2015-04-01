"use strict";

let EXPORTED_SYMBOLS = [
  "refresh",
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

function isInsideToolbar(win) {
  let widget = win.document.getElementById("tabgroupsbtn-btn-menu");
  if (widget) {
    let element = widget;
    for (let i = 0; i < 100; ++i) {
      let parent = element.parentNode;
      if (! parent)
        break;
      if (parent.tagName === "toolbar") {
        if (parent.id == "tabgroupsbtn-bar-toolbar")
          return true;
        break;
      }
      element = parent;
    }
  }
  return false;
}

function refresh(win=null, group=null) {
  win = win || getActiveWindow();
  if (! win)
    return;
  initPanorama(win).then(() => {
    group = group || getActiveGroup(win);
    //logger.debug('buttons:refresh: group = ' + group + " " + getGroupTitle(group));
    if (! group)
      return;
    let widget = win.document.getElementById("tabgroupsbtn-btn-menu");
    if (widget)
      widget.setAttribute("label", getGroupTitle(group));
  });
}

function showGroups(menu) {
  let win = getActiveWindow();
  let doc = win.document;

  clearPopup(menu);

  let hasNamedGroup = false;
  let separatoradded = false;
  for (let gr of getGroupList(win)) {
    let [id, title, active, group] = gr;

    let plainTitle = group.getTitle();
    if (! hasNamedGroup && plainTitle !== "")
      hasNamedGroup = true;
    if (! separatoradded && hasNamedGroup && plainTitle === "") {
      menu.appendChild(doc.createElement("menuseparator"));
      separatoradded = true;
    }

    menu.appendChild(createElement(doc, "menuitem", {
        value: id,
        class: "menuitem-iconic",
        image: getGroupImage(group),
        label: title,
        acceltext: group.getChildren().length,
        disabled: active,
        context: "tabgroupsbtn-btn-menu-context",
      }, {
        click: e => e.stopPropagation(),
        command: active ? undefined : e => selectGroup(win, id)
      }
    ));
  }
}

function createContextMenu(win) {
  let doc = win.document;
  let popupset = doc.getElementById("mainPopupSet");

  let context = createElement(doc, "menupopup", {id: "tabgroupsbtn-btn-menu-context"}, {popupshowing: e => showGroupContextMenu(e.target, e.target.triggerNode.getAttribute("value"))});
  popupset.appendChild(context);

  unload(() => popupset.removeChild(context));
}

function createWidgetListener() {
  let listener = {
    onWidgetAdded: (widget, area, position) => {
      let win = getActiveWindow();
      if (win && win.tabgroupsbtn && win.tabgroupsbtn.panoramaLoaded)
        refresh(win);
    }
  };
  CustomizableUI.addListener(listener);
  unload(() => CustomizableUI.removeListener(listener));
}

function registerWidgets() {
  CustomizableUI.createWidget({
    id: "tabgroupsbtn-btn", // should match the returned element id
    type: "custom",
    label: "Tab Groups Button",
    tooltiptext: "Tab Groups Button",
    defaultArea: CustomizableUI.AREA_NAVBAR,
    onBuild: function(doc) {
      let ti = createElement(doc, "toolbaritem", {id: "tabgroupsbtn-btn"});

      let placeholder = createElement(doc, "toolbarbutton", {
        id: "tabgroupsbtn-btn-placeholder",
        class: "toolbarbutton-1",
        label: "TabGroupsBtn:Menu",
      });
      ti.appendChild(placeholder);

      let container = createElement(doc, "hbox", {id: "tabgroupsbtn-btn-container"});
      ti.appendChild(container);

      // no active window
      let menubtn = createElement(doc, "toolbarbutton", {
          id: "tabgroupsbtn-btn-menu",
          type: "menu",
          class: "toolbarbutton-1",
          label: "Tab Groups",
          image: "chrome://tabgroupsbtn/skin/menutab.png"
        }, {
          click: event => {
            if (event.button === 2) { // right click
              event.preventDefault();
              event.stopPropagation();
              renameGroup();
            }
          },
          mouseover: e => {
            if (getPref("mouseover")) {
              let el = e.target;
              if (el.getAttribute("id") !== "tabgroupsbtn-menu-button")
                return;
              el.open = true;
            }
          }
        },
        createElement(doc, "menupopup", null, {popupshowing: e => initPanorama().then(() => showGroups(e.target))})
      );
      container.appendChild(menubtn);

      if (! getPref("closebtn-disabled")) {
        let closebtn = createElement(doc, "toolbarbutton", {
            id: "tabgroupsbtn-btn-close",
            class: "toolbarbutton-1",
            image: "chrome://tabgroupsbtn/skin/close.png"
          }, {
            command: event => {
              let win = getActiveWindow();
              initPanorama(win).then(() => {
                if (getGroupItems(win).groupItems.length == 1)
                  return;
                closeGroup(win, null, true);
              });
            }
          }
        );
        container.appendChild(closebtn);
      }

      if (! getPref("newbtn-disabled")) {
        let newbtn = createElement(doc, "toolbarbutton", {
            id: "tabgroupsbtn-btn-new",
            class: "toolbarbutton-1",
            image: "chrome://tabgroupsbtn/skin/new.png"
          }, {
            command: event => initPanorama().then(() => promptCreateGroup()),
            click: event => {
              if (event.button == 1) { // middle click
                event.preventDefault();
                event.stopPropagation();
                initPanorama().then(createGroup);
              } else if (event.button === 2) { // right click
                event.preventDefault();
                event.stopPropagation();
                initPanorama().then(createSubGroup);
              }
            }
          }
        );
        container.appendChild(newbtn);
      }

      return ti;
    }
  });
  unload(() => {
    logger.info("CustomizableUI.destroyWidget(tabgroupsbtn-btn)");
    CustomizableUI.destroyWidget("tabgroupsbtn-btn");
  });

  createWidgetListener();
}

// vim:set ts=2 sw=2 et:
