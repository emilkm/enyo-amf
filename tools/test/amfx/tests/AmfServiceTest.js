enyo.kind({
	name: "AmfServiceTest",
	kind: enyo.TestSuite,
	timeout: 10000,
    create: function() {
        this.inherited(arguments);
        enyo.amf.init("amfphp", "http://localhost:8000/server/amf.php");
    },
    _invokeAmfService: function(inProps, inParams, inAssertFn) {
        var amfs = this.createComponent({kind: enyo.AmfService, onResponse: "_response", onError: "_error", assertFn: inAssertFn}, inProps);
        return amfs.send(inParams);
    },
    _response: function(inSender, inResponse) {
        this.finish(inSender.assertFn(inResponse));
    },
    _error: function(inSender, inResponse) {
        this.finish("error: " + inResponse.data);
    },
    testPingPong: function() {
        this._invokeAmfService({source: "test", operation: "ping"}, null, function(inResponse) {
            return inResponse.data === 'pong';
        });
    }
});