enyo.kind({
	name: "AmfxTest",
	kind: enyo.TestSuite,
	timeout: 10000,
	testPingPong: function () {
        enyo.amf.init("amfphp", "http://emilkm.hp.af.cm/server/amf.php");
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
			.go([]);
	}
});
