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

function prompt(win, title, text, value) {
	let ps = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
	let input = {value: value};
	let check = {value: false};
	if (ps.prompt(win, title, text, input, null, check))
		return input.value;
}
function confirm(win, title, text) Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).confirm(win, title, text);
function alert(win, title, text) Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).alert(win, title, text);

function isPending(tab) tab.hasAttribute("pending");

function clearPopup(popup) {
	while (popup.children.length)
		popup.removeChild(popup.firstChild);
}
