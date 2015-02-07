function moveTabToGroup(win, tab, groupid) {
	let activegroup = getActiveGroup(win);
	if (activegroup.getChildren().length == 1)
		activegroup.newTab();
	getGroupItems(win).moveTabToGroupItem(tab, groupid);
}

function moveTabToNewGroup(win, tab) {
	let GI = getGroupItems(win);
	let group = GI.newGroup();
	GI.moveTabToGroupItem(tab, group.id);
	selectGroup(win, group.id);
}

function showMoveToGroupMenu(win, popup) {
	let tab = popup.parentNode.parentNode.triggerNode;
	let doc = win.document;

	clearPopup(popup);
	for (let gr of getGroupList(win)) {
		let [id, title, active] = gr;
		if (! active) {
			let mi = createElement(doc, "menuitem", {value: id, label: title}, {command: e => moveTabToGroup(win, tab, id)});
			popup.appendChild(mi);
		}
	}
	if (getActiveGroup(win).getChildren().length > 1) {
		popup.appendChild(createElement(doc, "menuseparator"));

		let mi = createElement(doc, "menuitem", {label: "New Group"}, {command: e => moveTabToNewGroup(win, tab)});
		popup.appendChild(mi);
	}
}

function addTabContextMenu(win) {
	let doc = win.document;

	let popup = createElement(doc, "menupopup", null, {popupshowing: event => showMoveToGroupMenu(win, event.target)});

	let menu = createElement(doc, "menu", {label: "Move to Group"});
	menu.appendChild(popup);

	let tabcontextmenu = doc.getElementById("tabContextMenu");
	tabcontextmenu.insertBefore(menu, doc.getElementById("context_openTabInWindow").nextSibling);
	unload(() => tabcontextmenu.removeChild(menu));

	let tabviewmenu = doc.getElementById("context_tabViewMenu");
	if (tabviewmenu)
		tabviewmenu.setAttribute("style", "display:none");
	unload(() => tabviewmenu.setAttibute("style", "display:-moz-box"));
}
