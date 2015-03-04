"use strict";

// previousGroupId defined in bootstrap
exports.register = function register(win) {
	let tabcontainer = win.gBrowser.tabContainer;

	function onTabSelect(event) {
		let activeGroup = getActiveGroup(win);
		updateGroup(win, getActiveGroup(win));
		refreshTabs(win);
	}
	tabcontainer.addEventListener("select", onTabSelect);
	unload(() => tabcontainer.removeEventListener("select", onTabSelect));

	// a tab group is removed when the last tab is closed
	// we want to prevent tabview from showing when the last tab is closed

	// alt 1: hide tabview as soon as it's visible
	// the group will not be closed, the browser will decide which tab will be focused next
	function onTabClose(event) {
		if (win.gBrowser.visibleTabs.length === 0)
			win.TabView._window.UI.hideTabView();
	}
	tabcontainer.addEventListener("TabClose", onTabClose, false);
	unload(() => tabcontainer.removeEventListener("TabClose", onTabClose, false));

	// alt 2: remove tabview event listener for tabclose
	// side effect: the group will be closed because it's empty. If the listener is not removed, it will set the UI._closedLastVisibleTab
	// and the group will not be closed

	// tabcontainer.removeEventListener("TabClose", win.TabView._window.UI._eventListeners.close, false);
	// unload(() => tabcontainer.addEventListener("TabClose", win.TabView._window.UI._eventListeners.close, false));
}
