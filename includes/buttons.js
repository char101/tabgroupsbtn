"use strict";
require("utils");

exports.refresh = function refresh(win=null, group=null) {
	win = win || getActiveWindow();
	if (! win)
		return;
	group = group || getActiveGroup(win);
	if (! group)
		return;
	let widget = win.document.getElementById("tabgroupsbtn-btn-menu");
	if (widget)
		widget.setAttribute("label", getGroupTitle(group));
}

function showTabs(popup) {
	let groupid = popup.parentNode.getAttribute("value");
	let win = getActiveWindow();
	let doc = win.document;
	let group = getGroup(win, groupid);

	clearPopup(popup);
	for (let ti of group.getChildren()) {
		let tab = ti.tab;
		let mi = createElement(doc, "menuitem", {
				label: tab.label,
				image: tab.image,
				class: "menuitem-iconic" + (tab.hasAttribute("pending") ? " tabgroupsbtn-btn-pending" : "")
			}, {
				command: e => win.gBrowser.selectedTab = tab
			}
		);
		popup.appendChild(mi);
	}
}

function showGroups(menu, showtabs=false) {
	let win = getActiveWindow();
	let doc = win.document;

	clearPopup(menu)
	let separatoradded = false;
	for (let gr of getGroupList(win)) {
		let [id, title, active, group] = gr;

		if (! separatoradded && group.getTitle() === "") {
			menu.appendChild(doc.createElement("menuseparator"));
			separatoradded = true;
		}

		if (! showtabs) {
			menu.appendChild(createElement(doc, "menuitem", {
					value: id,
					class: "menuitem-iconic",
					image: getGroupImage(group),
					label: title,
					acceltext: group.getChildren().length,
					disabled: active
				}, {
					click: e => e.stopPropagation(),
					command: active ? undefined : e => selectGroup(win, id)
				}
			))
		} else {
			if (group.getChildren().length > 0)
				menu.appendChild(createElement(doc, "menu", {
						value: id,
						class: "menu-iconic" + (active ? " tabgroupsbtn-btn-active" : ""),
						image: getGroupImage(group),
						label: title,
						acceltext: group.getChildren().length
					},
					null,
					createElement(doc, "menupopup", null, {popupshowing: e => { showTabs(e.target); e.stopPropagation(); }})
				));
			else
				menu.appendChild(createElement(doc, "menuitem", {label: title, acceltext: 0, disabled: true}));
		}
	}
}

exports.registerWidgets = function registerWidgets() {
	CustomizableUI.createWidget({
		id: "tabgroupsbtn-btn", // should match the returned element id
		type: "custom",
		label: "Tab Groups Button",
		tooltiptext: "Tab Groups Button",
		defaultArea: CustomizableUI.AREA_NAVBAR,
		onBuild: function(doc) {
			let ti = createElement(doc, "toolbaritem", {id: "tabgroupsbtn-btn"});

			let placeholder = createElement(doc, "toolbarbutton", {
				id: "tabgroupsbtn-btn-placeholder",
				class: "toolbarbutton-1",
				label: "TabGroupsBtn:Menu",
			});
			ti.appendChild(placeholder);

			let container = createElement(doc, "hbox", {id: "tabgroupsbtn-btn-container"});
			ti.appendChild(container);

			// no active window
			let menubtn = createElement(doc, "toolbarbutton", {
					id: "tabgroupsbtn-btn-menu",
					type: "menu",
					class: "toolbarbutton-1",
					label: "Tab Groups"
				}, {
					click: event => {
						if (event.button === 2) { // right click
							event.preventDefault();
							event.stopPropagation();
							renameGroup();
						}
					},
					mouseover: e => {
						if (getPref("mouseover")) {
							let el = e.target;
							if (el.getAttribute("id") !== "tabgroupsbtn-menu-button")
								return;
							let menutabbtn = getActiveWindow().document.getElementById("tabgroupsbtn-menutab-button");
							if (menutabbtn && menutabbtn.open)
								menutabbtn.open = false;
							el.open = true;
						}
					}
				},
				createElement(doc, "menupopup", null, {popupshowing: e => initPanorama().then(() => showGroups(e.target))})
			);
			container.appendChild(menubtn);

			if (! getPref("menutabbtn-disabled")) {
				let menutabbtn = createElement(doc, "toolbarbutton", {
						id: "tabgroupsbtn-btn-menutab",
						type: "menu",
						class: "toolbarbutton-1",
						image: "chrome://tabgroupsbtn/content/menutab.png"
					}, {
						mouseover: e => {
							if (getPref("mouseover")) {
								let el = e.target;
								if (el.getAttribute("id") !== "tabgroupsbtn-menutab-button")
									return;
								let menubtn = getActiveWindow().document.getElementById("tabgroupsbtn-menu-button");
								if (menubtn && menubtn.open)
									menubtn.open = false;
								e.target.open = true;
							}
						}
					},
					createElement(doc, "menupopup", null, {popupshowing: e => initPanorama().then(() => showGroups(e.target, true))})
				);
				container.appendChild(menutabbtn);
			}

			if (! getPref("closebtn-disabled")) {
				let closebtn = createElement(doc, "toolbarbutton", {
						id: "tabgroupsbtn-btn-close",
						class: "toolbarbutton-1",
						image: "chrome://tabgroupsbtn/content/close.png"
					}, {
						command: event => {
							let win = getActiveWindow();
							initPanorama(win).then(() => {
								if (getGroupItems(win).groupItems.length == 1)
									return;
								let group = getActiveGroup(win);
								let title = getGroupTitle(group);
								let ntabs = group.getChildren().length;
								let s = ntabs > 1 ? 's' : '';
								if (confirm("Confirm Close Tab Group", `You are about to close tab group ${title} (${ntabs} tab${s}). Are you sure you want to continue?`))
									closeGroup(win, getActiveGroup(win).id);
							});
						}
					}
				);
				container.appendChild(closebtn);
			}

			if (! getPref("newbtn-disabled")) {
				let newbtn = createElement(doc, "toolbarbutton", {
						id: "tabgroupsbtn-btn-new",
						class: "toolbarbutton-1",
						image: "chrome://tabgroupsbtn/content/new.png"
					}, {
						command: event => {
							let title = prompt("Create New Group", "Name:");
							if (title)
								initPanorama().then(() => createGroup(title));
						},
						click: event => {
							if (event.button == 1) {
								event.preventDefault();
								event.stopPropagation();
								initPanorama().then(createGroup);
							} else if (event.button === 2) { // right click
								event.preventDefault();
								event.stopPropagation();
								initPanorama().then(createSubGroup);
							}
						}
					}
				);
				container.appendChild(newbtn);
			}

			return ti;
		}
	});
	unload(() => CustomizableUI.destroyWidget("tabgroupsbtn-btn"));

	if (! getPref("customized"))
		CustomizableUI.addWidgetToArea("tabgroupsbtn-btn", CustomizableUI.AREA_NAVBAR, 0);

	let setCustomized = function(widget) {
		if (widget == "tabgroupsbtn-btn")
			setPref("customized", true);
	};
	let listener = {
		onWidgetAdded: (widget, area, position) => {
			setCustomized(widget);
			let win = getActiveWindow();
			if (win)
				updateGroup(win, getActiveGroup(win));
		},
		onWidgetMoved: (widget, area, oldpos, newpos) => setCustomized(widget),
		onWidgetRemoved: (widget, area) => setCustomized(widget),
	};
	CustomizableUI.addListener(listener);
	unload(() => CustomizableUI.removeListener(listener));
}
