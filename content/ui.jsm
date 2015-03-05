"use strict";

let EXPORTED_SYMBOLS = [
	"showGroupContextMenu",
];

const Cu = Components.utils;
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("chrome://tabgroupsbtn/content/utils.jsm");
Cu.import("chrome://tabgroupsbtn/content/tabgroups.jsm");

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

	popup.appendChild(createElement(doc, "menuseparator"));

	popup.appendChild(createElement(doc, "menuitem", {label: "Rename Group"}, {
		command: e => renameGroup(null, groupid)
	}));

	let mergePopup = createElement(doc, "menupopup", null, {popupshowing: e => {
		e.stopPropagation();
		showMergeMenu(e.target, groupid);
	}});
	popup.appendChild(createElement(doc, "menu", {label: "Merge Group"}, null, mergePopup));

	popup.appendChild(createElement(doc, "menuitem", {label: "Close Group"}, {
		command: e => closeGroup(null, groupid, true)
	}));
}
