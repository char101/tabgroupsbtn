let prefBranch = Services.prefs.getBranch("extensions.tabgroupsbtn.");

function getPref(key, defval=null) {
	switch (prefBranch.getPrefType(key)) {
		case prefBranch.PREF_STRING:
			return prefBranch.getCharPref(key);
		case prefBranch.PREF_BOOL:
			return prefBranch.getBoolPref(key);
		case prefBranch.PREF_INT:
			return prefBranch.getIntPref(key);
		case prefBranch.PREF_INVALID:
			return defval;
	}
}

function setPref(key, value) {
	switch (typeof value) {
		case "string":
			return prefBranch.setCharPref(key, value);
		case "boolean":
			return prefBranch.setBoolPref(key, value);
		case "number":
			return prefBranch.setIntPref(key, value);
	}
}
