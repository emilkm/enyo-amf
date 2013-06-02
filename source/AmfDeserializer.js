enyo.kind({
	name: "enyo.AmfDeserializer",
	kind: enyo.Object,

	constructor: function(data) {
		this.reader = new enyo.AmfReader(data);
	},

	readMessage: function() {
		var message = new enyo.amf.ActionMessage();
		message.version = this.reader.readUnsignedShort();
		var headerCount = this.reader.readUnsignedShort();
		for (var i = 0; i < headerCount; i++) {
			message.headers.push(this.readHeader());
		}
		var bodyCount = this.reader.readUnsignedShort();
		for (i = 0; i < bodyCount; i++) {
			message.bodies.push(this.readBody());
		}
		return message;
	},

	readHeader: function() {
		var header = new enyo.amf.MessageHeader();
		header.name = this.reader.readUTF();
		header.mustUnderstand = this.reader.readBoolean();
		this.reader.pos += 4; //length
		this.reader.reset();
		header.data = this.readObject();
		return header;
	},

	readBody: function() {
		var body = new enyo.amf.MessageBody();
		body.targetURI = this.reader.readUTF();
		body.responseURI = this.reader.readUTF();
		this.reader.pos += 4; //length
		this.reader.reset();
		body.data = this.readObject();
		return body;
	},

	readObject: function() {
		return this.reader.readObject();
	}

});