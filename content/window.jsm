"use strict";

let EXPORTED_SYMBOLS = [
	"addLinkContextMenu",
	"addTabContextMenu",
	"registerEventListeners"
];

const Cu = Components.utils;
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("chrome://tabgroupsbtn/content/addon.jsm");
Cu.import("chrome://tabgroupsbtn/content/utils.jsm");
Cu.import("chrome://tabgroupsbtn/content/tabgroups.jsm");
let buttons = Cu.import("chrome://tabgroupsbtn/content/buttons.jsm", {});
let toolbar = Cu.import("chrome://tabgroupsbtn/content/toolbar.jsm", {});

function showLinkContextMenu(win, popup) {
	let doc = win.document;
	let link = popup.parentNode.parentNode.triggerNode;

	clearPopup(popup);
	for (let gr of getGroupList(win)) {
		let [id, title, active] = gr;
		if (! active) {
			// let referer = win.gBrowser.selectedBrowser.currentURI;
			let mi = createElement(doc, "menuitem", {
				value: id,
				label: title
			}, {
				command: e => openLinkInGroup(win, link, id)
			});
			popup.appendChild(mi);
		}
	}

	popup.appendChild(createElement(doc, "menuseparator"));

	let newgroup = createElement(doc, "menuitem", {
		label: "New Group"
	}, {
		command: e => openLinkInNewGroup(win, link)
	});
	popup.appendChild(newgroup);
}

function addLinkContextMenu(win) {
	let doc = win.document;

	let mi = createElement(doc, "menu", {id: "tabgroupsbtn-openlink", label: "Open Link in Group"});
	mi.appendChild(createElement(doc, "menupopup", null, {
		popupshowing: e => showLinkContextMenu(win, e.target)
	}));

	let context = doc.getElementById("contentAreaContextMenu");
	context.insertBefore(mi, doc.getElementById("context-openlink"));

	let onpopupshowing = e => win.gContextMenu.showItem("tabgroupsbtn-openlink", win.gContextMenu.onSaveableLink);
	context.addEventListener("popupshowing", onpopupshowing, false);

	unload(() => {
		context.removeEventListener("popupshowing", onpopupshowing, false);
		context.removeChild(mi)
	});
}

function showTabContextMenu(win, popup) {
	let tab = popup.parentNode.parentNode.triggerNode;
	let doc = win.document;

	clearPopup(popup);
	for (let gr of getGroupList(win)) {
		let [id, title, active] = gr;
		if (! active) {
			let mi = createElement(doc, "menuitem", {
				value: id,
				label: title
			}, {
				command: e => moveTabToGroup(win, tab, id)
			});
			popup.appendChild(mi);
		}
	}
	if (getActiveGroup(win).getChildren().length > 1) {
		popup.appendChild(createElement(doc, "menuseparator"));

		let mi = createElement(doc, "menuitem", {
			label: "New Group"
		}, {
			command: e => moveTabToNewGroup(win, tab)
		});
		popup.appendChild(mi);
	}
}

function addTabContextMenu(win) {
	let doc = win.document;

	let popup = createElement(doc, "menupopup", null, {popupshowing: e => showTabContextMenu(win, e.target)});

	let menu = createElement(doc, "menu", {label: "Move to Group"});
	menu.appendChild(popup);

	// Add menu to tab context menu
	let tabcontextmenu = doc.getElementById("tabContextMenu");
	tabcontextmenu.insertBefore(menu, doc.getElementById("context_openTabInWindow").nextSibling);
	unload(() => tabcontextmenu.removeChild(menu));

	// Disable builtin move to group menu item
	let tabviewmenu = doc.getElementById("context_tabViewMenu");
	if (tabviewmenu) {
		tabviewmenu.setAttribute("style", "display:none");
		unload(() => tabviewmenu.setAttibute("style", "display:-moz-box"));
	}
}

function registerEventListeners(win) {
	let tabcontainer = win.gBrowser.tabContainer;

	function onTabSelect(event) {
		let activeGroup = getActiveGroup(win);
		buttons.refresh(win, getActiveGroup(win));
		toolbar.refresh(win);
	}
	tabcontainer.addEventListener("select", onTabSelect);
	unload(() => tabcontainer.removeEventListener("select", onTabSelect));

	// a tab group is removed when the last tab is closed
	// we want to prevent tabview from showing when the last tab is closed

	// alt 1: hide tabview as soon as it's visible
	// the group will not be closed, the browser will decide which tab will be focused next
	function onTabClose(event) {
		if (win.gBrowser.visibleTabs.length === 0)
			win.TabView._window.UI.hideTabView();
	}
	tabcontainer.addEventListener("TabClose", onTabClose, false);
	unload(() => tabcontainer.removeEventListener("TabClose", onTabClose, false));

	// alt 2: remove tabview event listener for tabclose
	// side effect: the group will be closed because it's empty. If the listener is not removed, it will set the UI._closedLastVisibleTab
	// and the group will not be closed

	// tabcontainer.removeEventListener("TabClose", win.TabView._window.UI._eventListeners.close, false);
	// unload(() => tabcontainer.addEventListener("TabClose", win.TabView._window.UI._eventListeners.close, false));
}
