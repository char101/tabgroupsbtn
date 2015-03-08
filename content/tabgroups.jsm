"use strict";

let EXPORTED_SYMBOLS = [
	"initPanorama",
	"getGroupItems",
	"getGroupList",
	"getGroup",
	"getGroupCount",
	"getActiveGroup",
	"getGroupTitle",
	"getGroupImage",
	"selectGroup",
	"createGroup",
	"promptCreateGroup",
	"createSubGroup",
	"closeGroup",
	"renameGroup",
	"mergeGroup",
];

const Cu = Components.utils;
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("chrome://tabgroupsbtn/content/utils.jsm");
Cu.import("chrome://tabgroupsbtn/content/addon.jsm");
Cu.import("chrome://tabgroupsbtn/content/log.jsm");

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
	if (! win) {
		console.error("getGroupItems: win is undefined");
	}
	let tv = win.TabView;
	if (! tv) {
		console.error("win.TabView is undefined");
		return;
	}
	let cw = tv.getContentWindow();
	if (! cw) {
		console.error("win.TabView.getContentWindow() is undefined");
		return;
	}
	return cw.GroupItems;
}

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

function getGroup(win, groupid) getGroupItems(win).groupItem(groupid)

function getGroupCount(win) getGroupItems(win).groupItems.length

function getActiveGroup(win=null) {
	win = win || getActiveWindow();
	if (! win)
		return;
	let gi = getGroupItems(win);
	if (gi)
		return gi.getActiveGroupItem();
}

function getGroupTitle(group, shortnames=false) group.getTitle() || (shortnames ? `Group ${group.id}` : `Group ${group.id}`)

function getGroupImage(group) {
	let ti = group.getActiveTab() || group.getChildren()[0];
	if (! ti)
		return;
	return ti.tab.image;
}

function selectGroup(win, groupid) {
	if (! win)
		return;
	let activeGroup = getActiveGroup(win);
	if (! activeGroup)
		return;
	if (activeGroup.id == groupid)
		return;

	let group = getGroup(win, groupid);
	let browser = win.gBrowser;

	if (group.getChildren().length === 0) {
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
	if (title !== null && title !== undefined && title !== "")
		group.setTitle(title);
	group.newTab();
	win.document.getElementById("urlbar").focus();
}

function promptCreateGroup(win=null) {
	win = win || getActiveWindow();
	let title = prompt("Create New Group", "Enter Group Title:\n(press OK to create unnamed group)");
	if (title !== undefined) // empty string = create unnamed group
		createGroup(title, win);
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

function closeGroup(win=null, groupid=null, doConfirm=false) {
	logger.info("closeGroup", groupid);

	win = win || getActiveWindow();

	let activeGroup = getActiveGroup(win);
	groupid = groupid || activeGroup.id;
	logger.info("activeGroup", activeGroup.id);

	let GI = getGroupItems(win);
	let tabgroups = GI.groupItems;
	if (tabgroups.length == 1)
		return;

	let group = getGroup(win, groupid);

	let ntabs = group.getChildren().length;
	let s = ntabs > 1 ? 's' : '';
	if (doConfirm && ! confirm("Confirm Close Tab Group", `You are about to close tab group ${getGroupTitle(group)} (${ntabs} tab${s}). Are you sure you want to continue?`))
		return false;

	if (groupid == activeGroup.id) {
		logger.info("Closing active group");
		// activate another group to prevent tabview from showing
		let focusgroup = null;
		let ngroup = tabgroups.length;
		for (let i = 0; i < (ngroup - 1); ++i)
			if (tabgroups[i].id == groupid) {
				focusgroup = tabgroups[i + 1];
				logger.info("Select next group", focusgroup.id);
				break;
			}
		if (focusgroup === null) {
			// no tab groups on the right, i.e. this is the rightmost group
			focusgroup = tabgroups[ngroup - 2];
			logger.info("Select previous group", focusgroup.id);
		}
		if (focusgroup)
			selectGroup(win, focusgroup.id);
	}

	group.destroy({immediately: true});
	triggerEvent(win, "tabgroupsbtn-group-closed");
	return true;
}

function renameGroup(win=null, groupid=null) {
	win = win || getActiveWindow();
	groupid = groupid || getActiveGroup(win);
	let group = getGroup(win, groupid);
	let name = prompt("Rename Tab Group", "Tab Group Name:", group.getTitle());
	if (name) {
		group.setTitle(name);
		triggerEvent(win, "tabgroupsbtn-group-renamed");
	}
}

function mergeGroup(win, src, dst) {
	let GI = getGroupItems(win);
	let srcGroup = getGroup(win, src);

	let srcTabItems = srcGroup.getChildren();
	for (let i = srcTabItems.length - 1; i > 0; --i) {
		GI.moveTabToGroupItem(srcTabItems[i].tab, dst);
	}
	srcGroup.newTab();
	GI.moveTabToGroupItem(srcGroup.getChildren()[0].tab, dst);

	selectGroup(win, dst);
	closeGroup(win, src);
}
