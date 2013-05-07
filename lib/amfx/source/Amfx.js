/**
 _enyo.Amfx_ is a wrapper for _XmlHttpRequest_ that uses
 the <a href="#enyo.Async">enyo.Async</a> API.

 _enyo.Amfx_ publishes all the properties of the
 <a href="#enyo.AmfxProperties">enyo.AmfxProperties</a>
 object.

 Like _enyo.Async_, _enyo.Amfx_ is an **Object**, not a **Component**.
 Do not try to make _enyo.Amfx_ objects inside a _components_ block.
 If you want to use _enyo.Amfx_ as a component, you should probably
 be using <a href="#enyo.AmfService">enyo.AmfService</a> instead.

 For more information, see the documentation on
 [Consuming Amf Services](https://github.com/emilkm/enyo-amf/wiki/Consuming-Amf-Services)
 in the Enyo-AMF Developer Guide.
 */
enyo.kind({
    name: "enyo.Amfx",
    kind: enyo.Async,
    //* See <a href="#enyo.AmfxProperties">enyo.AmfxProperties</a> for the list of properties
    //* published by _enyo.Amfx_.
    published: enyo.AmfxProperties,
    //* @protected
    constructor: function(inParams) {
        enyo.mixin(this, inParams);
        this.inherited(arguments);
    },
    //* @public
    /**
     Sends the Ajax request with parameters _inParams_. _inParams_ values may be
     either Strings or Objects.

     _inParams_ as an Object is converted into the url query string. For
     instance, passing <code>{q: "searchTerm"}</code> will result in the addition
     of the string `q="searchTerm"` to the current url query string.

     _inParams_ as a String is used as the query part of the URL directly.

     _inParams_ will not be converted into a POST body, it will always be used as
     part of the URL query string if provided.  Use the `postBody` property for
     specifying a body.

     When the request is completed, the code will set a `xhrResponse` property
     in the `enyo.Amfx` object with the subproperties `status`, `headers`, and
     `body`.  These cache the results from the XHR for later use.  The keys for
     the `headers` object have been converted to all lower case as HTTP headers
     are case-insensitive.
     */
    go: function(inParams) {
        if (!enyo.isArray(inParams)) {
            this.fail("inParams must be an array");
        }
        //enyo.amf will process the queue and call startTimer and request
        enyo.amf.invoke(this, inParams);
        return this;
    },
    //* @protected
    request: function(inParams) {
        var parts = enyo.amf.endpoint.split("?");
        var uri = parts.shift() || "";
        var args = parts.length ? (parts.join("?").split("&")) : [];
        //
        var query = null;
        //
        if (query) {
            args.push(query);
            query = null;
        }
        if (this.cacheBust) {
            args.push(Math.random());
        }
        //
        var url = args.length ? [uri, args.join("&")].join("?") : uri;
        //
        var xhr_headers = {};
        var serializer = new enyo.AmfSerializer();
        var message = enyo.amf.createMessage(this.source, this.operation, inParams);
        var body = serializer.writeMessage(message);
        xhr_headers["Content-Type"] = "application/x-amf; charset=UTF-8";//this.contentType;
        enyo.mixin(xhr_headers, this.headers);
        // don't pass in headers structure if there are no headers defined as this messes
        // up CORS code for IE8-9
        if (enyo.keys(xhr_headers).length === 0) {
            xhr_headers = undefined;
        }
        //
        this.startTimer();
        try {
            this.xhr = enyo.xhr.request({
                url: url,
                method: "POST",
                callback: this.bindSafely("receive"),
                body: body,
                headers: xhr_headers,
                sync: window.PalmSystem ? false : this.sync,
                xhrFields: this.xhrFields,
                mimeType: this.mimeType
            });
        }
        catch (e) {
            // IE can throw errors here if the XHR would fail CORS checks,
            // so catch and turn into a failure.
            this.fail(e);
        }
    },
    receive: function(inText, inXhr) {
        if (!this.failed && !this.destroyed) {
            var body;
            if (typeof inXhr.responseText === "string") {
                body = inXhr.responseText;
            } else {
                // IE carrying a binary
                body = inXhr.responseBody;
            }
            this.xhrResponse = {
                status: inXhr.status,
                headers: enyo.Amfx.parseResponseHeaders(inXhr),
                body: body
            };
            if (this.isFailure(inXhr)) {
                this.fail(inXhr.status);
            } else {
                var response = this.xhrToResponse(inXhr);
                if (response.code != 0) {
                    this.fail(response);
                } else {
                    this.respond(response);
                }
            }
        }
    },
    fail: function(inError) {
        // on failure, explicitly cancel the XHR to prevent
        // further responses.  cancellation also resets the
        // response headers & body,
        if (this.xhr) {
            enyo.xhr.cancel(this.xhr);
            this.xhr = null;
        }
        this.inherited(arguments);
    },
    xhrToResponse: function(inXhr) {
        if (inXhr) {
            return this.amfHandler(inXhr);
        }
    },
    isFailure: function(inXhr) {
        // if any exceptions are thrown while checking fields in the xhr,
        // assume a failure.
        try {
            var text = "";
            // work around IE8-9 bug where accessing responseText will thrown error
            // for binary requests.
            if (typeof inXhr.responseText === "string") {
                text = inXhr.responseText;
            }
            // Follow same failure policy as jQuery's Ajax code
            // CORS failures on FireFox will have status 0 and no responseText,
            // so treat that as failure.
            if (inXhr.status === 0 && text === "") {
                return true;
            }
            // Otherwise, status 0 may be good for local file access.  We treat the range
            // 1-199 and 300+ as failure (only 200-series code are OK).
            return (inXhr.status !== 0) && (inXhr.status < 200 || inXhr.status >= 300);
        }
        catch (e) {
            return true;
        }
    },
    amfHandler: function(inXhr) {
        var r = inXhr.responseText;
        try {
            var deserializer = new enyo.AmfDeserializer(r);
            var message = deserializer.readMessage();

            for (var bodyIndex in message.bodies) {
                var body = message.bodies[bodyIndex];
                if (body.targetURI && body.targetURI.indexOf("/onResult") > -1) {
                    if (body.targetURI == "/1/onResult") {
                        return {
                            code: 0,
                            data: body.data.clientId
                        };
                    } else {
                        enyo.amf.processQueue();
                        return {
                            code: 0,
                            data: body.data.body
                        };
                    }
                } else {
                    if (body.data._explicitType == "flex.messaging.messages.ErrorMessage") {
                        return {
                            code: body.data.faultCode,
                            data: body.data.faultString
                        };
                    }
                }
            }
            return {
                code: -1,
                data: "Malformed AMF message."
            };
        } catch(x) {
            enyo.warn("Ajax request set to handleAs AMF but data was not in AMF format.");
            return {
                code: -1,
                data: "AMF deserialization failed."
            };
        }
    },
    statics: {
        parseResponseHeaders: function(xhr) {
            var headers = {};
            var headersStr = [];
            if (xhr.getAllResponseHeaders) {
                headersStr = xhr.getAllResponseHeaders().split(/\r?\n/);
            }
            for (var i = 0; i < headersStr.length; i++) {
                var headerStr = headersStr[i];
                var index = headerStr.indexOf(': ');
                if (index > 0) {
                    var key = headerStr.substring(0, index).toLowerCase();
                    var val = headerStr.substring(index + 2);
                    headers[key] = val;
                }
            }
            return headers;
        }
    }
});
