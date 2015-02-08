function updateGroup(win, group) {
	let widget = win.document.getElementById("tabgroupsbtn-menu-button");
	if (widget)
		widget.setAttribute("label", getGroupTitle(group).replace(/:/g, ' | '));
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
				class: "menuitem-iconic" + (tab.hasAttribute("pending") ? " tabgroupsbtn-tab-pending" : "")
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
	let prevtitle = null;
	for (let gr of getGroupList(win)) {
		let [id, title, active, group] = gr;

		let origtitle = title;
		if (prevtitle !== null) {
			let temptitle = prevtitle;
			while (temptitle !== "") {
				if (title.startsWith(temptitle + ":"))
					title = "   ".repeat((temptitle.match(/:/g) || []).length + 1) + title.substring(temptitle.length + 1);
				temptitle = temptitle.match(/:/) ? temptitle.replace(/:[^:]*$/, '') : "";
			}
		}
		prevtitle = origtitle;

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
						class: "menu-iconic" + (active ? " tabgroupsbtn-menu-active" : ""),
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

function registerToolbarButtons() {
	CustomizableUI.createWidget({
		id: "tabgroupsbtn-toolbaritem",
		type: "custom",
		label: "Tab Groups Button",
		tooltiptext: "Tab Groups Button",
		defaultArea: CustomizableUI.AREA_NAVBAR,
		onBuild: function(doc) {
			let ti = createElement(doc, "toolbaritem", {id: "tabgroupsbtn-toolbaritem"});

			// no active window
			let menubtn = createElement(doc, "toolbarbutton", {
					id: "tabgroupsbtn-menu-button",
					type: "menu",
					class: "toolbarbutton-1",
					label: "Tab Groups Button"
				}, {
					click: event => {
						if (event.button === 2) { // right click
							event.preventDefault();
							event.stopPropagation();
							renameGroup();
						}
					},
				},
				createElement(doc, "menupopup", null, {popupshowing: e => showGroups(e.target)})
			);
			ti.appendChild(menubtn);

			if (! getPref("menutabbtn-disabled", false)) {
				let menutabbtn = createElement(doc, "toolbarbutton", {
						id: "tabgroupsbtn-menutab-button",
						type: "menu",
						class: "toolbarbutton-1",
						image: "chrome://tabgroupsbtn/content/menutab.png"
					},
					null,
					createElement(doc, "menupopup", null, {popupshowing: e => showGroups(e.target, true)})
				);
				ti.appendChild(menutabbtn);
			}

			if (! getPref("closebtn-disabled", false)) {
				let closebtn = createElement(doc, "toolbarbutton", {
						id: "tabgroupsbtn-close-button",
						class: "toolbarbutton-1",
						image: "chrome://tabgroupsbtn/content/close.png"
					}, {
						command: event => {
							let win = getActiveWindow();
							if (getGroupItems(win).groupItems.length == 1)
								return;
							let group = getActiveGroup(win);
							let title = getGroupTitle(group);
							let ntabs = group.getChildren().length;
							let s = ntabs > 1 ? 's' : '';
							if (confirm("Confirm Close Tab Group", `You are about to close tab group ${title} (${ntabs} tab${s}). Are you sure you want to continue?`))
								closeGroup(win, getActiveGroup(win).id);
						}
					}
				);
				ti.appendChild(closebtn);
			}

			if (! getPref("newbtn-disabled", false)) {
				let newbtn = createElement(doc, "toolbarbutton", {
						id: "tabgroupsbtn-new-button",
						class: "toolbarbutton-1",
						image: "chrome://tabgroupsbtn/content/new.png"
					}, {
						command: event => createGroup(getActiveWindow()),
						click: event => {
							if (event.button === 2) { // right click
								event.preventDefault();
								event.stopPropagation();
								createSubGroup(getActiveWindow());
							}
						}
					}
				);
				ti.appendChild(newbtn);
			}

			return ti;
		}
	});
	unload(() => CustomizableUI.destroyWidget("tabgroupsbtn-toolbaritem"));

	if (! getPref("customized"))
		CustomizableUI.addWidgetToArea("tabgroupsbtn-toolbaritem", CustomizableUI.AREA_NAVBAR, 0);

	let setCustomized = function(widget) {
		if (widget == "tabgroupsbtn-toolbaritem")
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
		onWidgetRemoved: (widget, area) => {
			setCustomized(widget);
			let win = getActiveWindow();
			if (win)
				win.document.getElementById("tabgroupsbtn-toolbaritem").setAttribute("label", "Tab Groups Button");
		}
	};
	CustomizableUI.addListener(listener);
	unload(() => CustomizableUI.removeListener(listener));
}
