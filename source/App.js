enyo.kind({
	name: "App",
	kind: "FittableRows",
	fit: true,
    create: function() {
        enyo.amf.init("efxphp", "http://10.1.1.116/m-efts/server/gateway.php");
        this.inherited(arguments);
    },
	components:[
		{kind: "onyx.Toolbar", content: "Hello World", components: [
            {kind: "onyx.Button", content: "Login", ontap: "login"}
        ]},
		{kind: "enyo.Scroller", fit: true, components: [
			{name: "main", classes: "nice-padding", allowHtml: true}
		]},
		{kind: "onyx.Toolbar", components: [
			{kind: "onyx.Button", content: "Tap me", ontap: "helloWorldTap"}
		]}
	],
    login: function(inSender, inEvent) {

    },
	helloWorldTap: function(inSender, inEvent) {
		this.$.main.addContent("ping<br/>");
        var amfx = new enyo.Amfx({
            source: "amfr",
            operation: "ping"
        });
        amfx.go([]);
        amfx.response(this, "processResponse");
        amfx.error(this, "processError");
    },
    processResponse: function(inSender, inResponse) {
        this.$.main.addContent(inResponse.data + "<br/>");
    },
    processError: function(inSender, inResponse) {
        this.$.main.addContent(inResponse.data);
    }
});
