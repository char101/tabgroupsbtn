/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Speak Words.
 *
 * The Initial Developer of the Original Code is The Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *	 Edward Lee <edilee@mozilla.com>
 *	 Erik Vold <erikvvold@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var {unload} = require("unload");
Cu.import("resource://gre/modules/Services.jsm", this);

/**
 * Waits for a browser window to finish loading before running the callback
 *
 * @usage runOnLoad(window, callback): Apply a callback to to run on a window when it loads.
 * @param [function] callback: 1-parameter function that gets a browser window.
 * @param [function] winType: a parameter that defines what kind of window is "browser window".
 */
exports.runOnLoad = function runOnLoad(window, callback, winType) {
	// Listen for one load event before checking the window type
	window.addEventListener("load", function() {
		window.removeEventListener("load", arguments.callee, false);

		// Now that the window has loaded, only handle browser windows
		if (window.document.documentElement.getAttribute("windowtype") == winType)
			callback(window);
	}, false);
}


/**
 * Add functionality to existing browser windows
 *
 * @usage runOnWindows(callback): Apply a callback to each open browser window.
 * @param [function] callback: 1-parameter function that gets a browser window.
 * @param [function] winType: a parameter that defines what kind of window is "browser window".
 */
exports.runOnWindows = function runOnWindows(callback, winType) {
	// Wrap the callback in a function that ignores failures
	function watcher(window) {
		try {
			callback(window);
		}
		catch(ex) {}
	}

	// Add functionality to existing windows
	let browserWindows = Services.wm.getEnumerator(winType);
	while (browserWindows.hasMoreElements()) {
		// Only run the watcher immediately if the browser is completely loaded
		let browserWindow = browserWindows.getNext();
		if (browserWindow.document.readyState == "complete")
			watcher(browserWindow);
		// Wait for the window to load before continuing
		else
			runOnLoad(browserWindow, watcher, winType);
	}
}

/**
 * Apply a callback to each open and new browser windows.
 *
 * @usage watchWindows(callback): Apply a callback to each browser window.
 * @param [function] callback: 1-parameter function that gets a browser window.
 * @param [function] winType: a parameter that defines what kind of window is "browser window".
 */
exports.watchWindows = function watchWindows(callback, winType) {
	// Wrap the callback in a function that ignores failures
	function watcher(window) {
		try {
			callback(window);
		}
		catch(ex) {}
	}

	// Add functionality to existing windows
	runOnWindows(callback, winType);

	// Watch for new browser windows opening then wait for it to load
	function windowWatcher(subject, topic) {
		if (topic == "domwindowopened")
			runOnLoad(subject, watcher, winType);
	}
	Services.ww.registerNotification(windowWatcher);

	// Make sure to stop watching for windows if we're unloading
	unload(function() Services.ww.unregisterNotification(windowWatcher));
}
