Cu.import("resource:///modules/CustomizableUI.jsm");

function updateGroup(win, group) {
	let widget = win.document.getElementById("tabgroupsbtn-menu-button");
	if (widget) {
		let title = getGroupTitle(group);
		title = title.replace(/:/g, ' | ');
		widget.setAttribute("label", title);
	}
}

function showGroups(menu) {
	let win = getActiveWindow();
	let doc = win.document;

	clearPopup(menu)
	let separatoradded = false;
	let prevtitle = null;
	for (let gr of getGroupList(win)) {
		let [id, title, active, group] = gr;

		let origtitle = title;
		if (prevtitle !== null && title.startsWith(prevtitle + ":")) {
			title = "   ".repeat((prevtitle.match(/:/g) || []).length + 1) + title.substring(prevtitle.length + 1);
		}
		prevtitle = origtitle;

		if (! separatoradded && group.getTitle() === "") {
			menu.appendChild(doc.createElement("menuseparator"));
			separatoradded = true;
		}

		let mi = createElement(doc, "menuitem", {
			value: id,
			class: "menuitem-iconic",
			image: getGroupImage(group),
			label: title,
			acceltext: group.getChildren().length,
		}, {
			click: e => e.stopPropagation()
		});
		if (! active)
			mi.addEventListener("command", e => selectGroup(win, id));
		else
			mi.setAttribute("disabled", true);
		menu.appendChild(mi);
	}
}

function registerToolbarButtons() {
	CustomizableUI.createWidget({
		id: "tabgroupsbtn-toolbaritem",
		type: "custom",
		label: "Tab Groups Button",
		tooltiptext: "Tab Groups Button",
		defaultArea: CustomizableUI.AREA_NAVBAR,
		onBuild(doc) {
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
			});

			let menu = createElement(doc, "menupopup", null, {popupshowing: event => showGroups(event.target)});
			menubtn.appendChild(menu);

			let closebtn = createElement(doc, "toolbarbutton", {
				id: "tabgroupsbtn-close-button",
				class: "toolbarbutton-1",
				image: "chrome://tabgroupsbtn/content/close.png"
			}, {command: event => {
				let win = getActiveWindow();
				if (getGroupItems(win).groupItems.length == 1)
					return;
				let group = getActiveGroup(win);
				let title = getGroupTitle(group);
				let ntabs = group.getChildren().length;
				let s = ntabs > 1 ? 's' : '';
				if (confirm("Confirm Close Tab Group", `You are about to close tab group ${title} (${ntabs} tab${s}). Are you sure you want to continue?`))
					closeGroup(win, getActiveGroup(win).id);
			}});

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
			});

			let ti = createElement(doc, "toolbaritem", {id: "tabgroupsbtn-toolbaritem"});
			appendChild(ti, menubtn, closebtn, newbtn);

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
