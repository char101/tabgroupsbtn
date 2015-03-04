function isToolbarUpdateRequired(groups, container) {
	let items = container.children;

	if (groups.length !== items.length)
		return true;

	if (getPref("bar.tab")) {
		for (let i = 0, n = groups.length; i < n; ++i) {
			let [id, title, active, group] = groups[i];
			let tab = items[i];
			if (id.toString() !== tab.value || active !== tab.selected) {
				return true;
			}
		}
	} else {
		for (let i = 0, n = groups.length; i < n; ++i) {
			let [id, title, active, group] = groups[i];
			let btn = items[i];
			if (id.toString() !== btn.value || active !== btn.checked)
				return true;
		}
	}

	return false;
}

function clearToolbarSelectedState(container) {
	let children = container.children;
	if (getPref("bar.tab")) {
		for (let i = 0, n = children.length; i < n; ++i) {
			let tab = children[i];
			if (tab.selected) {
				tab.setAttribute("selected", false);
				break;
			}
		}
	} else {
		for (let i = 0, n = children.length; i < n; ++i) {
			let btn = children[i];
			if (btn.checked) {
				btn.checked = false;
				break;
			}
		}
	}
}

exports.refresh = function refresh(win=null) {
	if (win === null)
		win = getActiveWindow();
	let doc = win.document;
	let items = doc.getElementById("tabgroupsbtn-bar-items");
	if (! items)
		return;
	initPanorama(win).then(() => {
		let groups = getGroupList(win, true);
		if (isToolbarUpdateRequired(groups, items)) {
			// console.log("refreshTabs");

			if (getPref("bar.tab")) {
				clearTabs(items);

				for (let gr of groups) {
					let [id, title, active, group] = gr;
					let tab = createElement(doc, "tab", {
						id: "tabgroupsbtn-bar-tab-" + id,
						label: title,
						selected: active,
						value: id
					}, {
						command: e => {
							clearToolbarSelectedState(items);
							tab.setAttribute("selected", true);
							selectGroup(win, id);
						}
					});
					items.appendChild(tab);
				}
			} else {
				clearChildren(items);

				for (let gr of getGroupList(win)) {
					let [id, title, active, group] = gr;
					let btn = createElement(doc, "toolbarbutton", {
						type: "checkbox",
						class: "toolbarbutton-1 tabgroupsbtn-bar-button",
						label: title,
						checked: active,
						value: id
					}, {
						command: e => {
							clearToolbarSelectedState(items);
							btn.checked = true;
							selectGroup(win, id);
						}
					});
					items.appendChild(btn);
				}
			}
		}
	});
}

exports.manualRefresh = function manualRefresh(win) {
	if (win === null)
		win = getActiveWindow();
	let doc = win.document;
	let ti = doc.getElementById("tabgroupsbtn-bar");
	if (! ti)
		return;
	let btn = createElement(doc, "toolbarbutton", {
		class: "toolbarbutton-1 tabgroupsbtn-bar-manual",
		label: "Load Groups",
	});
	btn.addEventListener("command", e => {
		ti.removeChild(btn);
		refreshTabs(win);
	}, false);
	ti.insertBefore(btn, ti.firstChild);
}

exports.registerWidget = function registerWidget() {
	CustomizableUI.createWidget({
		id: "tabgroupsbtn-bar",
		type: "custom",
		label: "Tab Groups Button (Bar)",
		tooltiptext: "Tab Groups Button (Bar)",
		// no defaultarea = the widget will not be added automatically
		onBuild: function(doc) {
			let ti = createElement(doc, "toolbaritem", {
				id: "tabgroupsbtn-bar",
				flex: 1,
				mousethrough: "always",
			});

			let placeholder = createElement(doc, "toolbarbutton", {
				id: "tabgroupsbtn-bar-placeholder",
				class: "toolbarbutton-1",
				label: "TabGroupsBtn:Bar",
			});
			ti.appendChild(placeholder);

			let container = createElement(doc, "hbox", {
				id: "tabgroupsbtn-bar-container",
				allowevents: true,
				flex: 1,
				mousethrough: "always"
			});
			ti.appendChild(container);

			if (getPref("bar.tab")) {
				let tabbox = createElement(doc, "tabbox", {
					id: "tabgroupsbtn-bar-tabbox",
					flex: 1
				});
				container.appendChild(tabbox);

				let tabs = createElement(doc, "tabs", {
					id: "tabgroupsbtn-bar-tabs",
					flex: 1
				});
				tabbox.appendChild(tabs);

				let scroll = createElement(doc, "arrowscrollbox", {
					id: "tabgroupsbtn-bar-items",
					smoothscroll: true,
					allowevents: true,
					clicktoscroll: true,
					flex: 1,
					orient: "horizontal",
				});
				tabs.appendChild(scroll);
			} else {
				let scroll = createElement(doc, "scrollbox", {id: "tabgroupsbtn-bar-items"});
				container.appendChild(scroll);
			}

			return ti;
		}
	});
	unload(() => CustomizableUI.destroyWidget("tabgroupsbtn-bar"));

	CustomizableUI.registerArea("tabgroupsbtn-bar-toolbar", {
		type: CustomizableUI.TYPE_TOOLBAR,
		defaultPlacements: ["tabgroupsbtn-bar"]
	});
	unload(() => CustomizableUI.unregisterArea("tabgroupsbtn-bar-toolbar"));

	let listener = {
		onWidgetAdded: (widget, area, position) => {
			let win = getActiveWindow();
			if (win)
				refreshTabs(win);
		},
	};
	CustomizableUI.addListener(listener);
	unload(() => CustomizableUI.removeListener(listener));
}

exports.createToolbar = function createToolbar(win) {
	let doc = win.document;
	let toolbar = createElement(doc, "toolbar", {
		id: "tabgroupsbtn-bar-toolbar",
		class: "toolbar-primary chromeclass-toolbar",
		toolbarname: "Tab Groups Button",
		defaultset: "tabgroupsbtn-bar",
		hidden: false,
		mode: "full", // icons/text/null
		iconsize: "small",
		customizable: true
	});
	doc.getElementById("navigator-toolbox").insertBefore(toolbar, doc.getElementById("TabsToolbar"));
	unload(() => {
		let tb = doc.getElementById("tabgroupsbtn-bar-toolbar");
		if (tb)
			tb.remove();
	});
}
