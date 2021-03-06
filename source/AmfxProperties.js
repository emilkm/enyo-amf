/**
	Common set of published properties used in both
	<a href="#enyo.Amfx">enyo.Amfx</a> and
	<a href="#enyo.AmfService">enyo.AmfService</a>.
*/
enyo.AmfxProperties = {
	/**
		The service name.
	*/
	source: "",
	/**
		The service method.
	*/
	operation: "",
	/**
		When true, appends a random number as a parameter for GET requests
		to try to force a new fetch of the resource instead of reusing a local cache.
	*/
	cacheBust: true,
	/**
		Optional additional request headers as a JS object, e.g.
		<code>{ "X-My-Header": "My Value", "Mood": "Happy" }</code> or null.
	*/
	headers: null,
	/**
		The content for the request body.
	*/
	params: "",
	/**
		Optional object with fields to pass directly to the underlying XHR object.
		One example is the _withCredentials_ flag used for cross-origin requests.
	*/
	xhrFields: null
};
