function openLinkInGroup(win, link, groupid) {
	selectGroup(win, groupid);

	let tb = win.gBrowser;
	tb.selectedTab = tb.addTab(link.href);
}

function openLinkInNewGroup(win, link) {
	selectGroup(win, getGroupItems(win).newGroup().id);
	win.gBrowser.loadURI(link.href);
}

function showOpenLinkMenu(win, popup) {
	let doc = win.document;
	let link = popup.parentNode.parentNode.triggerNode;

	clearPopup(popup);
	for (let gr of getGroupList(win)) {
		let [id, title, active] = gr;
		if (! active) {
			// let referer = win.gBrowser.selectedBrowser.currentURI;
			let mi = createElement(doc, "menuitem", {value: id, label: title}, {command: e => openLinkInGroup(win, link, id)});
			popup.appendChild(mi);
		}
	}

	popup.appendChild(createElement(doc, "menuseparator"));

	let newgroup = createElement(doc, "menuitem", {label: "New Group"}, {command: e => openLinkInNewGroup(win, link)});
	popup.appendChild(newgroup);
}

function addLinkContextMenu(win) {
	let doc = win.document;

	let mi = createElement(doc, "menu", {id: "tabgroupsbtn-openlink", label: "Open Link in Group"});
	mi.appendChild(createElement(doc, "menupopup", null, {popupshowing: e => showOpenLinkMenu(win, e.target)}));

	let context = doc.getElementById("contentAreaContextMenu");
	context.insertBefore(mi, doc.getElementById("context-openlink"));
	let onpopupshowing = e => win.gContextMenu.showItem("tabgroupsbtn-openlink", win.gContextMenu.onSaveableLink);
	context.addEventListener("popupshowing", onpopupshowing, false);
	unload(() => {
		context.removeEventListener("popupshowing", onpopupshowing, false);
		context.removeChild(mi)
	});
}
