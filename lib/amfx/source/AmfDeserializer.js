enyo.kind({
    name: "enyo.AmfDeserializer",
    kind: enyo.Object,

    constructor: function(data) {
        this.reader = new enyo.AmfReader(data);
    },
    
    readMessage: function() {
        var message = new enyo.amf.ActionMessage();
        var version = this.reader.readUnsignedShort();
        message.version = version;
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
        var name = this.reader.readUTF();
        header.name = name;
        var mustUnderstand = this.reader.readBoolean();
        header.mustUnderstand = mustUnderstand;
        this.reader.pos += 4; //length
        this.worker.reset();
        var data = this.readObject();
        header.data = data;
        return header;
    },
    
    readBody: function() {
        var body = new enyo.amf.MessageBody();
        var targetURI = this.reader.readUTF();
        body.targetURI = targetURI;
        var responseURI = this.reader.readUTF();
        body.responseURI = responseURI;
        this.reader.pos += 4; //length
        this.reader.reset();
        var data = this.readObject();
        body.data = data;
        return body;
    },
    
    readObject: function() {
        return this.reader.readObject();
    }

});