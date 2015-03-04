"use strict";

let EXPORTED_SYMBOLS = [
	"getGroupList",
	"getGroupListP",
	"initPanorama",
	"getGroupItems",
	"getGroup",
	"getActiveGroup",
	"getGroupTitle",
	"getGroupImage",
	"selectGroup",
	"createGroup",
	"createSubGroup",
	"closeGroup",
	"renameGroup",
];

const Cu = Components.utils;
Cu.import("chrome://tabgroupsbtn/content/utils.jsm")

function getGroupList(win, shortnames=false) {
	let GI = getGroupItems(win);
	let groups = [];
	let activegroup = GI.getActiveGroupItem();
	for (let gi of GI.groupItems)
		groups.push([gi.id, getGroupTitle(gi, shortnames), gi == activegroup, gi]);
	// sort by has title first then by title
	groups.sort((a, b) => {
		let at = a[3].getTitle();
		let bt = b[3].getTitle();
		let r = (at === "") - (bt === "");
		if (r === 0)
			r = (at === "") ? (a[3].id - b[3].id) : (at.toLowerCase().localeCompare(bt.toLowerCase()));
		return r;
	});
	return groups;
}

function getGroupListP(win) new Promise((resolve, reject) => {
	win.TabView._initFrame(function() {
		resolve(getGroupList(win));
	});
});

function initPanorama(win=null) {
	if (win === null)
		win = getActiveWindow();
	if (! win)
		return;
	return new Promise((next, err) => win.TabView._initFrame(() => {
		let gi = getGroupItems(win);
		if (gi)
			next();
		else
			err();
	}));
}

function getGroupItems(win) {
	let cw = win.TabView.getContentWindow();
	if (cw)
		return cw.GroupItems;
}
function getGroup(win, groupid) getGroupItems(win).groupItem(groupid);
function getActiveGroup(win=null) {
	win = win || getActiveWindow();
	if (! win)
		return;
	let gi = getGroupItems(win);
	if (gi)
		return gi.getActiveGroupItem();
}
function getGroupTitle(group, shortnames=false) group.getTitle() || (shortnames ? `Group ${group.id}` : `Unnamed ${group.id}`);
function getGroupImage(group) {
	let ti = group.getActiveTab() || group.getChildren()[0];
	if (! ti)
		return;
	return ti.tab.image;
}

function selectGroup(win, groupid) {
	let group = getGroup(win, groupid);
	let browser = win.gBrowser;

	if (group.getChildren().length == 0) {
		group.newTab();
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

function createGroup(title=null, win=null) {
	win = win || getActiveWindow();
	let group = getGroupItems(win).newGroup();
	if (title !== null && title !== undefined)
		group.setTitle(title);
	group.newTab();
	win.document.getElementById("urlbar").focus();
}

function createSubGroup(win=null) {
	win = win || getActiveWindow();
	let title = getActiveGroup(win).getTitle();
	if (title === "") {
		createGroup();
	} else {
		let subtitle = prompt(`New Subgroup of ${title}`, "Name:");
		if (subtitle)
			createGroup(win, `${title} / ${subtitle}`);
	}
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
	if (name)
		group.setTitle(name);
}
