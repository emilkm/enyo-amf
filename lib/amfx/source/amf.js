//* @protected
enyo.amf = {
	
    CONST: {
        EMPTY_STRING : "",
        NULL_STRING : "null",
        UNDEFINED_TYPE : 0,
        NULL_TYPE : 1,
        FALSE_TYPE : 2,
        TRUE_TYPE : 3,
        INTEGER_TYPE : 4,
        DOUBLE_TYPE : 5,
        STRING_TYPE : 6,
        XML_TYPE : 7,
        DATE_TYPE : 8,
        ARRAY_TYPE : 9,
        OBJECT_TYPE : 10,
        XMLSTRING_TYPE : 11,
        BYTEARRAY_TYPE : 12,
        AMF0_AMF3 : 17,
        UINT29_MASK : 536870911,
        INT28_MAX_VALUE : 268435455,
        INT28_MIN_VALUE : -268435456,
        CLASS_ALIAS : "_explicitType"
    },
    requestTimeout: 30000, //30 seconds
    messageQueue: [],
    clientId: null,
    sequence: 1,
    destination: "",
    endpoint: "",
    headers: null,
    doNothing: new Function,
    sessionId: null,

    init: function(destination, endpoint, timeout) {
        this.clientId = null;
        this.sequence = 1;
        this.destination = destination;
        this.endpoint = endpoint;
        this.requestTimeout = timeout ? timeout : 30000; //30 seconds
        this.headers = [];
    },

    addHeader: function(name, value) {
        var header = {};
        header[name] = value;
        this.headers.push(header);
    },

    ActionMessage: function() {
        return {
            _explicitType: "flex.messaging.io.amf.ActionMessage",
            version: 3,
            headers: [{name:"mobile", mustUnderstand:false, data:true}],
            bodies: []
        };
    },

    MessageBody: function() {
        return {
            //this._explicitType = "flex.messaging.io.amf.MessageBody";
            targetURI: "null",
            responseURI: "/1",
            data: []
        };
    },

    MessageHeader: function() {
        return {
            //this._explicitType = "flex.messaging.io.amf.MessageHeader";
            name: "",
            mustUnderstand: false,
            data: null
        };
    },

    CommandMessage: function() {
        return {
            _explicitType: "flex.messaging.messages.CommandMessage",
            destination: "",
            operation: 5,
            //body: [],
            //headers: null,//{DSId:'nil'},
            clientId: null
        };
    },

    RemotingMessage: function() {
        return {
            _explicitType : "flex.messaging.messages.RemotingMessage",
            destination: "",
            source: "",
            operation: "",
            body: [],
            //headers: null,//{DSId:'nil'},
            clientId: null
        };
    },

    AcknowledgeMessage: function() {
        return {
            _explicitType : "flex.messaging.messages.AcknowledgeMessage",
            body: null,
            headers: [],
            messageId: null,
            clientId: null
        }
    },
    
    createMessage: function(source, operation, params) {
        var actionMessage = new enyo.amf.ActionMessage();
        var messageBody = new enyo.amf.MessageBody();
        var message;
        if (source == "ping") {
            this.sequence = 1;
            messageBody.responseURI = "/" + this.sequence++;
            message = new enyo.amf.CommandMessage();
            message.destination = this.destination;
        } else {
            messageBody.responseURI = "/" + this.sequence++;
            message = new enyo.amf.RemotingMessage();
            message.destination = this.destination;
            message.source = source;
            message.operation = operation;
            message.body = params;
            //message.headers['DSId'] = this.clientId;
            message.clientId = this.clientId;

            for (var i = 0; i < this.headers.length; i++) {
                var header = this.headers[i];
                for (var headerName in header) {
                    message.headers[headerName] = header[headerName];
                }
            }
        }

        messageBody.data.push(message);
        actionMessage.bodies.push(messageBody);
        return actionMessage;
    },

    invoke: function(async, params) {
        if (this.clientId == null && this.messageQueue.length == 0) {
            var amfx = new enyo.Amfx({
                source: "ping",
                operation: "ping"
            });
            amfx.response(this, "pingResponse");
            amfx.error(this, "pingError");

            this.messageQueue.push([amfx, params]);
            this.processQueue();
        }
        this.messageQueue.push([async, params]);
        if (this.clientId != null) {
            this.processQueue();
        }
    },

    processQueue: function() {
        while (this.messageQueue.length > 0) {
            var args = this.messageQueue.shift();
            args[0].request(args[1]);
            if (args[0].source == "ping") {
                return;
            }
        }
    },

    pingResponse: function(inSender, inResponse) {
        enyo.amf.clientId = inResponse.data;
        enyo.amf.processQueue();
    },

    pingError: function(inSender, inResponse) {
        alert("pingError");
    }
};
