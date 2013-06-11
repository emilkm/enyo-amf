/* jshint node:true */
/* global phantom, console */

// PhantomJS driver for loading enyo-amf tests and checking for failures
var page = require('webpage').create();

page.settings.localToRemoteUrlAccessEnabled = true;

page.onConsoleMessage = function (msg) {
	console.log("JS: " + msg);
	if (msg === "TEST RUNNER FINISHED") {
		var pass = page.evaluate(function() {
			return (document.querySelector(".enyo-amf-testcase-failed") === null);
		});
		if (pass) {
			console.log("enyo-amf tests passed.");
			phantom.exit(0);
		} else {
			console.log("enyo-amf tests failed.");
			phantom.exit(1);
		}
	}
};

page.onError = function(msg, trace) {
	console.log("page error, msg: " + msg);
	console.log("page error, trace: " + trace);
	phantom.exit(2);
};

page.open("tools/test/amfx/index.html", function(status) {
	if (status !== "success") {
		console.log("error loading page, status: " + status);
		phantom.exit(3);
	}
});

setTimeout(function() {
	console.log("timed out after 1 minute");
	phantom.exit(4);
}, 60 * 1000);