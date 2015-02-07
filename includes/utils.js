const FM = Cc["@mozilla.org/focus-manager;1"].getService(Ci.nsIFocusManager);

function getActiveWindow() FM.activeWindow;

function getGroupItems(win) win.TabView.getContentWindow().GroupItems;
function getGroup(win, groupid) getGroupItems(win).groupItem(groupid);
function getActiveGroup(win) getGroupItems(win).getActiveGroupItem();
function getGroupTitle(group) group.getTitle() || `Group ${group.id}`;
function getGroupList(win) {
	let GI = getGroupItems(win);
	let groups = [];
	let activegroup = GI.getActiveGroupItem();
	for (let gi of GI.groupItems)
		groups.push([gi.id, getGroupTitle(gi), gi == activegroup]);
	groups.sort((a, b) => a[1].toLowerCase().localeCompare(b[1].toLowerCase()));
	return groups;
}

function createElement(doc, tag, attributes, eventhandlers) {
	let el = doc.createElement(tag);
	if (attributes)
		for (let key in attributes)
			el.setAttribute(key, attributes[key]);
	if (eventhandlers)
		for (let event in eventhandlers)
			el.addEventListener(event, eventhandlers[event])
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
