const FM = Cc["@mozilla.org/focus-manager;1"].getService(Ci.nsIFocusManager);

function getActiveWindow() FM.activeWindow;

function getGroupItems(win) win.TabView.getContentWindow().GroupItems;
function getGroup(win, groupid) getGroupItems(win).groupItem(groupid);
function getActiveGroup(win) getGroupItems(win).getActiveGroupItem();
function getGroupTitle(group) group.getTitle() || `Group ${group.id}`;
function getGroupImage(group) {
	let ti = group.getActiveTab() || group.getChildren()[0];
	if (! ti)
		return;
	return ti.tab.image;
}
function getGroupList(win) {
	let GI = getGroupItems(win);
	let groups = [];
	let activegroup = GI.getActiveGroupItem();
	for (let gi of GI.groupItems)
		groups.push([gi.id, getGroupTitle(gi), gi == activegroup, gi]);
	// sort by has title first then by title
	groups.sort((a, b) => {
		let r = (a[3].getTitle() === "") - (b[3].getTitle() === "");
		if (r === 0)
			r = naturalSort(a[1].toLowerCase(), b[1].toLowerCase());
		return r;
	});
	return groups;
}

function createElement(doc, tag, attributes, eventhandlers, ...children) {
	let el = doc.createElement(tag);
	if (attributes)
		for (let key in attributes) {
			let val = attributes[key];
			if (val !== undefined && val !== null)
				el.setAttribute(key, val);
		}
	if (eventhandlers)
		for (let event in eventhandlers) {
			let handler = eventhandlers[event];
			if (typeof handler === "function")
				el.addEventListener(event, handler);
		}
	if (children)
		for (let child of children)
			if (typeof child === "object")
				el.appendChild(child);
	return el;
}
function appendChild(parent, ...children) {
	for (let child of children)
		parent.appendChild(child);
}

function prompt(title, text, value) {
	let ps = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
	let input = {value: value};
	let check = {value: false};
	if (ps.prompt(getActiveWindow(), title, text, input, null, check))
		return input.value;
}
function confirm(title, text) Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).confirm(getActiveWindow(), title, text);
function alert(title, text) Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).alert(getActiveWindow(), title, text);

function isPending(tab) tab.hasAttribute("pending");
function isBlank(win, tab) {
	let uri = win.gBrowser.getBrowserForTab(tab).currentURI.spec;
	return uri == "about:blank" || uri == "about:newtab" || uri == "about:privatebrowsing";
}

function clearPopup(popup) {
	while (popup.children.length)
		popup.removeChild(popup.firstChild);
}
