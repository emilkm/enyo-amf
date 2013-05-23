//* @protected
enyo.kind({
	name: "enyo._AmfxComponent",
	kind: enyo.Component,
	published: enyo.AmfxProperties
});

//* @public
/**
	_enyo.AmfService_ is a component that performs AMF requests (_XmlHttpRequest_).

	Internally, _enyo.AmfService_ uses _enyo.Async_ subkind (namely,
	<a href="#enyo.Amfx">enyo.Ajax</a>) to manage transactions.
	The _send_ method returns the Async instance used by the request.

	_enyo.AmfService_ uses _enyo.Amfx_ and, like _enyo.Amfx_, it
	publishes all the properties of the
	<a href="#enyo.AmfxProperties">enyo.AmfxProperties</a> object.

	For more information, see the documentation on
	[Consuming Amf Services](https://github.com/emilkm/enyo-amf/wiki/Consuming-Amf-Services)
	in the Enyo-AMF Developer Guide.
*/
enyo.kind({
	name: "enyo.AmfService",
	kind: enyo._AmfxComponent,
	published: {
		/**
			If set to a non-zero value, the number of milliseconds to
			wait after the _send_ call before failing with a "timeout" error
		*/
		timeout: 0
	},
	events: {
		/**
			Fires when a response is received.

			_inEvent.amfx_ contains the Async instance associated with the request.

			_inEvent.data_ contains the response data.
		*/
		onResponse: "",
		/**
			Fires when an error is received.

			_inEvent.amfx_ contains the	Async instance associated with the request.

			_inEvent.data_ contains the error data.
		*/
		onError: ""
	},
	//* @protected
	constructor: function(inProps) {
		this.inherited(arguments);
	},
	//* @public
	/**
		Sends an AMF request with the passed-in parameters, returning the
		associated Async instance.

		_inProps_ is an optional object parameter that can be used to override some
		of the AJAX properties for this request, such as _headers_.
	*/
	send: function(inParams, inProps) {
		return this.sendAmfx(inParams, inProps);
	},
	//* @protected
	sendAmfx: function(inParams, inProps) {
		var amfx = new enyo.Amfx(inProps);
		for (var n in enyo.AmfxProperties) {
			amfx[n] = this[n];
		}
		amfx.timeout = this.timeout;
		enyo.mixin(amfx, inProps);
		return this.sendAsync(amfx, inParams);
	},
	sendAsync: function(inAmfx, inParams) {
		return inAmfx.go(inParams).response(this, "response").error(this, "error");
	},
	response: function(inSender, inData) {
		this.doResponse({amfx: inSender, data: inData});
	},
	error: function(inSender, inData) {
		this.doError({amfx: inSender, data: inData});
	}
});
