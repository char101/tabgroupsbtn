const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");

(function(global) {
	var modules = {};
	global.require = function require(src) {
		if (modules[src])
			return modules[src];
		var scope = {require: global.require, Cu: global.Cu, Ci: global.Ci, Cc: global.Cc, exports: {}};
		var tools = {};
		Cu.import("resource://gre/modules/Services.jsm", tools);
		var baseURI = tools.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null);
		var uri = tools.Services.io.newURI("modules/" + src + ".js", null, baseURI);
		tools.Services.scriptloader.loadSubScript(uri.spec, scope);
		return modules[src] = scope.exports || scope.module.exports;
	};
})(this);

let {unload} = require("unload");
let {runOnLoad, runOnWindows, watchWindows} = require("window-utils");

function getGroupItems(win) win.TabView.getContentWindow().GroupItems;
function getGroup(win, groupid) getGroupItems(win).groupItem(groupid);
function getActiveGroup(win) getGroupItems(win).getActiveGroupItem();
function getGroupTitle(group) group.getTitle() || `Group ${group.id}`;
function createElement(doc, tag, attributes) {
	let el = doc.createElement(tag);
	for (let key in attributes)
		el.setAttribute(key, attributes[key]);
	return el;
}
function isPending(tab) tab.hasAttribute("pending");
function prompt(win, title, text, value) {
	let ps = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
	let input = {value: value};
	let check = {value: false};
	if (ps.prompt(win, title, text, input, null, check))
		return input.value;
}

function updateGroup(win, group) win.document.getElementById("tabgroupsbtn-menu-button").setAttribute("label", getGroupTitle(group))

function showGroups(win, menu) {
	while (menu.children.length)
		menu.removeChild(menu.firstChild);

	let GI = getGroupItems(win);

	let doc = win.document;
	let activegroup = GI.getActiveGroupItem();

	let tabgroups = GI.groupItems;
	let groups = [];
	for (let gr of tabgroups)
		groups.push([gr.id, getGroupTitle(gr), gr == activegroup]);
	groups.sort((a, b) => a[1].toLowerCase().localeCompare(b[1].toLowerCase()));

	for (let gr of groups) {
		let [id, title, active] = gr;
		let mi = createElement(doc, "menuitem", {
			value: id,
			label: title
		});
		mi.addEventListener("click", e => e.stopPropagation());
		if (! active) {
			mi.addEventListener("command", e => selectGroup(win, id));
		} else {
			mi.setAttribute("disabled", true);
		}
		menu.appendChild(mi);
	}
}

function selectGroup(win, groupid) {
	let group = getGroup(win, groupid);

	let GI = getGroupItems(win);
	GI.setActiveGroupItem(group);

	updateGroup(win, group);

	let browser = win.gBrowser;
	if (group.getChildren().length == 0) {
		browser.loadOneTab("about:blank", {inBackground: false});
	} else {
		let tab = (group.getActiveTab() || group.getChild(0)).tab;
		if (isPending(tab)) {
			let tabitems = group.getChildren();
			for (let ti of tabitems)
				if (! isPending(ti.tab))
					tab = ti.tab;
		}
		browser.selectedTab = tab;
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

function renameGroup(win) {
	let group = getActiveGroup(win);
	let name = prompt(win, "Rename Tab Group", "Tab Group Name:", group.getTitle());
	if (name) {
		group.setTitle(name);
		updateGroup(win, group);
	}
}

function processWindow(win) {
	win.TabView._initFrame(function() {
		let doc = win.document;

		let menu = doc.createElement("menupopup");
		menu.addEventListener("popupshowing", event => showGroups(win, event.target));

		let menubtn = createElement(doc, "toolbarbutton", {
			id: "tabgroupsbtn-menu-button",
			type: "menu",
			class: "toolbarbutton-1",
			label: getGroupTitle(getGroupItems(win).getActiveGroupItem()),
		});
		menubtn.appendChild(menu);
		menubtn.addEventListener("click", event => {
			if (event.button === 2) {
				event.preventDefault();
				event.stopPropagation();
				renameGroup(win);
			}
		});

		let closebtn = createElement(doc, "toolbarbutton", {
			id: "tabgroupsbtn-close-button",
			class: "close-icon"
		});
		closebtn.addEventListener("command", event => closeGroup(win, getActiveGroup(win).id));

		let newbtn = createElement(doc, "toolbarbutton", {
			id: "tabgroupsbtn-new-button",
			class: "tabs-newtab-button"
		});
		newbtn.addEventListener("command", event => createGroup(win));

		let urlbar = doc.getElementById("urlbar-container");

		let ti = createElement(doc, "toolbaritem", {id: "tabgroupsbtn-toolbaritem"});
		ti.appendChild(menubtn);
		ti.appendChild(closebtn);
		ti.appendChild(newbtn);
		urlbar.insertBefore(ti, urlbar.children[0]);
		unload(() => urlbar.removeChild(ti));

		let selectlistener = event => updateGroup(win, getActiveGroup(win));
		win.gBrowser.tabContainer.addEventListener("select", selectlistener);
		unload(() => win.gBrowser.tabContainer.removeEventListener("select", selectlistener));
	});
}

function install(data, reason) {}
function uninstall(data, reason) {}
function startup(data, reason) {
	let ss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
	let ssuri = Services.io.newURI("chrome://tabgroupsbtn/content/style.css", null, null);
	ss.loadAndRegisterSheet(ssuri, ss.AUTHOR_SHEET);
	unload(() => ss.unregisterSheet(ssuri, ss.AUTHOR_SHEET));

	watchWindows(processWindow, "navigator:browser");
}
function shutdown(data, reason) unload();
