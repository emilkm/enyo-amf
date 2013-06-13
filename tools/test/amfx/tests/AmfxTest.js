enyo.kind({
	name: "AmfxTest",
	kind: enyo.TestSuite,
	timeout: 10000,
    create: function() {
        this.inherited(arguments);
        enyo.amf.init("amfphp", "http://localhost:8000/server/amf.php");
    },
	testPingPong: function () {
		return new enyo.Amfx({source: "test", operation: "ping"})
			.response(this, function(inSender, inResponse) {
				if (inResponse.data === 'pong') {
					this.finish("");
				} else {
					this.finish("unexpected response data");
				}
			})
			.error(this, function(inSender, inResponse) {
				this.finish("ping-pong request failed");
			})
			.go();
	}
});
