enyo.kind({
	name: "enyo.AmfSerializer",
	kind: enyo.Object,

	constructor: function() {
		this.writer = new enyo.AmfWriter();
	},
	
	writeMessage: function(message) {
		try {
			this.writer.writeShort(message.version);
			this.writer.writeShort(message.headers.length);
			for (var header in message.headers) {
				this.writeHeader(message.headers[header]);
			}
			this.writer.writeShort(message.bodies.length);
			for (var body in message.bodies) {
				this.writeBody(message.bodies[body]);
			}
		} catch (e) {
		}
		//return this.writer.getResult();
		return this.writer.data;
	},
	
	writeObject: function(object) {
		this.writer.writeObject(object);
	},
	
	writeHeader: function(header) {
		this.writer.writeUTF(header.name);
		this.writer.writeBoolean(header.mustUnderstand);
		this.writer.writeInt(1); //UNKNOWN_CONTENT_LENGTH used to be -1
		this.writer.reset();
		//this.writer.writeObject(header.data);
		this.writer.write(1); //boolean amf0 marker
		this.writer.writeBoolean(true);
	},
	
	writeBody: function(body) {
		if (body.targetURI == null) {
			this.writer.writeUTF(enyo.amf.CONST.NULL_STRING);
		} else {
			this.writer.writeUTF(body.targetURI);
		}
		if (body.responseURI == null) {
			this.writer.writeUTF(enyo.amf.CONST.NULL_STRING);
		} else {
			this.writer.writeUTF(body.responseURI);
		}
		this.writer.writeInt(1); //UNKNOWN_CONTENT_LENGTH used to be -1
		this.writer.reset();
		this.writer.write(enyo.amf.CONST.AMF0_AMF3); //AMF0_AMF3
		this.writeObject(body.data);
	}

});