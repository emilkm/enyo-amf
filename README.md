enyo-amf
========

AMF Remoting for Enyo

Enyo-AMF is an Enyo [AMF 3 Client library](https://github.com/emilkm/amfjs/) plugin. 

## Lib

As recommended by Enyo's documentation the library is located in a subfolder of _lib_ called _amfx_

# What Do I Get

Enyo-AMF mimics the Enyo Ajax package which includes amf xhr (Amfx) functionality, and an implementation of amf xhr as a Component (AmfService).

# Enough talk, give me an example

This example is based on [enyo bootplate](https://github.com/enyojs/bootplate/) application

```javascript
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
```

```javascript
enyo.amf.init("efxphp", "http://127.0.0.1/server/gateway.php");
```

__enyo.amf.init__ sets the _destination_ and _endpoint_ of the AMF Client.


```javascript
var amfx = new enyo.Amfx({
	source: "test",
	operation: "ping"
});
amfx.go([]);
amfx.response(this, "processResponse");
amfx.error(this, "processError");
```

Sends and AMF request to the _test_ service, invoking the _ping_ method with no parameters. 

```javascript
processResponse: function(inSender, inResponse) {
	this.$.main.addContent(inResponse.data + "<br/>");
},
processError: function(inSender, inResponse) {
	this.$.main.addContent(inResponse.data);
}
```

The _processResponse_ and _processError_ display the response data depending on the outcome of the operation.

The PHP service is very simple and looks like this.

```php
<?php
class test
{
    public function ping()
	{
		return 'pong';
	}
}
?>
```

If the AMF Client has not been assigned a _clientId_ by the server, a __flex.messaging.messages.CommandMessage__  with a _CLIENT_PING_OPERATION_ will be sent to the server first, in order to test connectivity over the current channel to the remote endpoint, and get a _clientId_ assigned.
