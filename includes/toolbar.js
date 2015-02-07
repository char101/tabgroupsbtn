Cu.import("resource:///modules/CustomizableUI.jsm");

function updateGroup(win, group) win.document.getElementById("tabgroupsbtn-menu-button").setAttribute("label", getGroupTitle(group))

function showGroups(win, menu) {
	let GI = getGroupItems(win);

	let doc = win.document;
	let activegroup = GI.getActiveGroupItem();

	let tabgroups = GI.groupItems;
	let groups = [];
	for (let gr of tabgroups)
		groups.push([gr.id, getGroupTitle(gr), gr == activegroup]);
	groups.sort((a, b) => a[1].toLowerCase().localeCompare(b[1].toLowerCase()));

	clearPopup(menu)
	for (let gr of groups) {
		let [id, title, active] = gr;
		let mi = createElement(doc, "menuitem", {value: id, label: title}, {click: e => e.stopPropagation()});
		if (! active)
			mi.addEventListener("command", e => selectGroup(win, id));
		else
			mi.setAttribute("disabled", true);
		menu.appendChild(mi);
	}
}

function addToolbarButtons(win) {
	CustomizableUI.createWidget({
		id: "tabgroupsbtn-toolbaritem",
		type: "custom",
		label: "Tab Groups Button",
		defaultArea: CustomizableUI.AREA_NAVBAR,
		onBuild(doc) {
			let menubtn = createElement(doc, "toolbarbutton", {
				id: "tabgroupsbtn-menu-button",
				type: "menu",
				class: "toolbarbutton-1",
				label: getGroupTitle(getGroupItems(win).getActiveGroupItem()),
			}, {
				click: event => {
					if (event.button === 2) { // right click
						event.preventDefault();
						event.stopPropagation();
						renameGroup(win);
					}
				},
			});

			let menu = createElement(doc, "menupopup", null, {popupshowing: event => showGroups(win, event.target)});
			menubtn.appendChild(menu);

			let closebtn = createElement(doc, "toolbarbutton", {
				id: "tabgroupsbtn-close-button",
				class: "toolbarbutton-1",
				image: "chrome://tabgroupsbtn/content/close.png"
			}, {command: event => {
				let group = getActiveGroup(win);
				let title = getGroupTitle(group);
				let ntabs = group.getChildren().length;
				let s = ntabs > 1 ? 's' : '';
				if (confirm(win, "Confirm Close Tab Group", `You are about to close tab group ${title} (${ntabs} tab${s}). Are you sure you want to continue?`))
					closeGroup(win, getActiveGroup(win).id);
			}});

			let newbtn = createElement(doc, "toolbarbutton", {
				id: "tabgroupsbtn-new-button",
				class: "toolbarbutton-1",
				image: "chrome://tabgroupsbtn/content/new.png"
			}, {command: event => createGroup(win)});

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
		onWidgetAdded: (widget, area, position) => setCustomized(widget),
		onWidgetMoved: (widget, area, oldpos, newpos) => setCustomized(widget),
		onWidgetRemoved: (widget, area) => setCustomized(widget)
	};
	CustomizableUI.addListener(listener);
	unload(() => CustomizableUI.removeListener(listener));
}
