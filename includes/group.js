function selectGroup(win, groupid) {
	let group = getGroup(win, groupid);
	let browser = win.gBrowser;

	if (group.getChildren().length == 0) {
		browser.loadOneTab("about:blank", {inBackground: false});
	} else {
		let tab = (group.getActiveTab() || group.getChild(0)).tab;
		if (! isPending(tab)) {
			browser.selectedTab = tab;
			return;
		}

		for (let ti of group.getChildren())
			if (! isPending(ti.tab) || isBlank(win, ti.tab)) {
				browser.selectedTab = tab;
				return;
		}

		group.newTab();
	}
}

function createGroup(win) {
	getGroupItems(win).newGroup().newTab();
	win.document.getElementById("urlbar").focus();
}

function closeGroup(win, groupid) {
	let GI = getGroupItems(win);
	let tabgroups = GI.groupItems;

	if (tabgroups.length == 1)
		return;

	// activate another group to prevent tabview from showing
	let focusgroup = null;
	for (let i = 0; i < (tabgroups.length - 1); ++i)
		if (tabgroups[i].id == groupid) {
			focusgroup = tabgroups[i + 1];
			break;
		}
	if (focusgroup === null)
		focusgroup = tabgroups[tabgroups.length - 2];

	selectGroup(win, focusgroup.id);

	getGroup(win, groupid).destroy({immediately: true});
}

function renameGroup() {
	let win = getActiveWindow();
	let group = getActiveGroup(win);
	let name = prompt("Rename Tab Group", "Tab Group Name:", group.getTitle());
	if (name) {
		group.setTitle(name);
		updateGroup(win, group);
	}
}
