enyo.kind({
	name: "XhrTest",
	kind: enyo.TestSuite,
	testXhrSync: function() {
		var x = enyo.xhr.request({
			url: "http://127.0.0.1:8080/lib/amfx/tools/test/amfx/php/test1.php?format=text",
			sync: true
		});
		if (x.responseText) {
			this.finish("");
		}
		else {
			this.finish("sync XHR didn't return with text");
		}
	},
    testXhrArrayBuffer: function() {
        var self = this;
        enyo.xhr.request({
            url: "http://127.0.0.1:8080/lib/amfx/tools/test/amfx/php/test8.php",
            method: "POST",
            sync: false,
            body: new Uint8Array([]),
            headers: {"Content-Type": "application/x-amf; charset=UTF-8"},
            xhrFields: {responseType: "arraybuffer"},
            callback: function (inText, inXhr) {
                if (inXhr.response instanceof ArrayBuffer) {
                    self.finish("");
                } else {
                    self.finish("Response not an arraybuffer");
                }
            }
        });
    }
});