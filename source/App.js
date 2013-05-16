enyo.kind({
    name: "App",
    kind: "FittableRows",
    fit: true,
    create: function() {
        this.inherited(arguments);
        enyo.amf.init("amfphp", "http://127.0.0.1/server/gateway.php");
    },
    components:[
        {kind: "onyx.Toolbar", content: "Hello World"},
        {kind: "enyo.Scroller", fit: true, components: [
            {name: "main", classes: "nice-padding", allowHtml: true}
        ]},
        {kind: "onyx.Toolbar", components: [
            {kind: "onyx.Button", content: "Tap me", ontap: "helloWorldTap"}
        ]}
    ],
    helloWorldTap: function(inSender, inEvent) {
        this.$.main.addContent("ping<br/>");
        var amfx = new enyo.Amfx({
            source: "test",
            operation: "ping"
        });
        amfx.response(this, "processResponse");
        amfx.error(this, "processError");
        amfx.go([]);
    },
    processResponse: function(inSender, inResponse) {
        this.$.main.addContent(inResponse.data + "<br/>");
    },
    processError: function(inSender, inResponse) {
        this.$.main.addContent(inResponse.data);
    }
});
