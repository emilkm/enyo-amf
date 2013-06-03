enyo.kind({
	name: "enyo.AmfReader",
	kind: enyo.Object,

	constructor: function(data) {
		this.objects = [];
		this.traits = [];
		this.strings = [];
		this.data = data;
		this.pos = 0;
	},

	read: function() {
		return this.data[this.pos++];
	},

	readUnsignedShort: function() {
		var ch1 = this.read();
		var ch2 = this.read();
		return (ch1 << 8) + (ch2 << 0);
	},

	readUInt29: function() {
		// Each byte must be treated as unsigned
		var b = this.read() & 255;

		if (b < 128) {
			return b;
		}
		var value = (b & 127) << 7;
		b = this.read() & 255;

		if (b < 128) {
			return (value | b);
		}
		value = (value | (b & 127)) << 7;
		b = this.read() & 255;

		if (b < 128) {
			return (value | b);
		}
		value = (value | (b & 127)) << 8;
		b = this.read() & 255;

		return (value | b);
	},

	readFully: function(buff, start, length) {
		for (var i = start; i < length; i++) {
			buff[i] = this.read();
		}
	},

	readUTF: function(length) {
		var utflen = length ? length : this.readUnsignedShort();
		var chararr = [];
		var p = this.pos;
		var c1, c2, c3;

		while (this.pos < p + utflen) {
			c1 = this.read();
			if (c1 < 128) {
				chararr.push(String.fromCharCode(c1));
			} else if (c1 > 2047) {
				c2 = this.read();
				c3 = this.read();
				chararr.push(String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)));
			} else {
				c2 = this.read();
				chararr.push(String.fromCharCode(((c1 & 31) << 6) | (c2 & 63)));
			}
		}
		// The number of chars produced may be less than utflen
		return chararr.join("");
	},

	reset: function() {
		this.objects = [];
		this.traits = [];
		this.strings = [];
	},

	readObject: function() {
		var type = this.read();
		return this.readObjectValue(type);
	},

	readString: function() {
		var ref = this.readUInt29();
		if ((ref & 1) === 0) {
			return this.getString(ref >> 1);
		} else {
			var len = (ref >> 1);
			if (len === 0) {
				return enyo.amf.CONST.EMPTY_STRING;
			}
			var str = this.readUTF(len);
			this.rememberString(str);
			return str;
		}
	},

	rememberString: function(v) {
		this.strings.push(v);
	},

	getString: function(v) {
		return this.strings[v];
	},

	getObject: function(v) {
		return this.objects[v];
	},

	getTraits: function(v) {
		return this.traits[v];
	},

	rememberTraits: function(v) {
		this.traits.push(v);
	},

	rememberObject: function(v) {
		this.objects.push(v);
	},

	readTraits: function(ref) {
		if ((ref & 3) == 1) {
			return this.getTraits(ref >> 2);
		} else {
			var count = (ref >> 4);
			var className = this.readString();
			var traits = {};
			if (className != null && className !== "") {
				traits[enyo.amf.CONST.CLASS_ALIAS] = className;
			}
			traits.props = [];
			for (var i = 0; i < count; i++) {
				traits.props.push(this.readString());
			}
			this.rememberTraits(traits);
			return traits;
		}
	},

	readScriptObject: function() {
		var ref = this.readUInt29();
		if ((ref & 1) === 0) {
			return this.getObject(ref >> 1);
		} else {
			var traits = this.readTraits(ref);
			var obj = {};
			if (enyo.amf.CONST.CLASS_ALIAS in traits) {
				obj[enyo.amf.CONST.CLASS_ALIAS] = traits[enyo.amf.CONST.CLASS_ALIAS];
			}
			this.rememberObject(obj);
			for (var i in traits.props) {
				obj[traits.props[i]] = this.readObject();
			}
			if ((ref & 8) == 8) {//dynamic
				for (; ;) {
					var name = this.readString();
					if (name == null || name.length === 0) {
						break;
					}
					obj[name] = this.readObject();
				}
			}
			return obj;
		}
	},

	readArray: function() {
		var ref = this.readUInt29();
		if ((ref & 1) === 0) {
			return this.getObject(ref >> 1);
		}
		var len = (ref >> 1);
		var map = null, i;
		while (true) {
			var name = this.readString();
			if (!name) {
				break;
			}
			if (!map) {
				map = {};
				this.rememberObject(map);
			}
			map[name] = this.readObject();
		}
		if (!map) {
			var array = new Array(len);
			this.rememberObject(array);
			for (i = 0; i < len; i++) {
				array[i] = this.readObject();
			}
			return array;
		} else {
			for (i = 0; i < len; i++) {
				map[i] = this.readObject();
			}
			return map;
		}
	},

	readDouble: function() {
		var c1, c2, c3, c4, c5, c6, c7, c8, d;
		c1 = this.read() & 255; c2 = this.read() & 255;
		if (c1 === 255) {
			if (c2 === 248) { return Number.NaN; }
			if (c2 === 240) { return Number.NEGATIVE_INFINITY; }
		} else if (c1 === 127 && c2 === 240) { return Number.POSITIVE_INFINITY };
		c3 = this.read() & 255; c4 = this.read() & 255; c5 = this.read() & 255; c6 = this.read() & 255; c7 = this.read() & 255; c8 = this.read() & 255;
		if (!c1 && !c2 && !c3 && !c4) { return 0; }
		for (d = (c1 << 4 & 2047 | c2 >> 4) - 1023, c2 = ((c2 & 15) << 16 | c3 << 8 | c4).toString(2), c3 = c2.length; c3 < 20; c3++) c2 = "0" + c2;
		c6 = ((c5 & 127) << 24 | c6 << 16 | c7 << 8 | c8).toString(2);
		for (c3 = c6.length; c3 < 31; c3++) c6 = "0" + c6;
		c5 = parseInt(c2 + (c5 >> 7 ? "1" : "0") + c6, 2);
		if (c5 === 0 && d == -1023) { return 0; }
		return (1 - (c1 >> 7 << 1)) * (1 + Math.pow(2, -52) * c5) * Math.pow(2, d);
	},

	readDate: function() {
		var ref = this.readUInt29();
		if ((ref & 1) === 0) {
			return this.getObject(ref >> 1);
		}
		var time = this.readDouble();
		var date = new Date(time);
		this.rememberObject(date);
		return date;
	},

	readMap: function() {
		var ref = this.readUInt29();
		if ((ref & 1) === 0) {
			return this.getObject(ref >> 1);
		}
		var length = (ref >> 1);
		var map = null;
		if (length > 0) {
			map = {};
			this.rememberObject(map);
			var name = this.readObject();
			while (name != null) {
				map[name] = this.readObject();
				name = this.readObject();
			}
		}
		return map;
	},

	readByteArray: function() {
		var ref = this.readUInt29();
		if ((ref & 1) === 0) {
			return this.getObject(ref >> 1);
		} else {
			var len = (ref >> 1);
			var ba = [];
			this.readFully(ba, 0, len);
			this.rememberObject(ba);
			return ba;
		}
	},

	readObjectValue: function(type) {
		var value = null;

		switch (type) {
		case enyo.amf.CONST.STRING_TYPE:
			value = this.readString();
			break;
		case enyo.amf.CONST.OBJECT_TYPE:
			try {
				value = this.readScriptObject();
			} catch (e) {
				throw "Failed to deserialize:" + e;
			}
			break;
		case enyo.amf.CONST.ARRAY_TYPE:
			value = this.readArray();
			//value = this.readMap();
			break;
		case enyo.amf.CONST.FALSE_TYPE:
			value = false;
			break;
		case enyo.amf.CONST.TRUE_TYPE:
			value = true;
			break;
		case enyo.amf.CONST.INTEGER_TYPE:
			value = this.readUInt29();
			// Symmetric with writing an integer to fix sign bits for
			// negative values...
			value = (value << 3) >> 3;
			break;
		case enyo.amf.CONST.DOUBLE_TYPE:
			value = this.readDouble();
			break;
		case enyo.amf.CONST.UNDEFINED_TYPE:
		case enyo.amf.CONST.NULL_TYPE:
			break;
		case enyo.amf.CONST.DATE_TYPE:
			value = this.readDate();
			break;
		case enyo.amf.CONST.BYTEARRAY_TYPE:
			value = this.readByteArray();
			break;
		case enyo.amf.CONST.AMF0_AMF3:
			value = this.readObject();
			break;
		default:
			throw "Unknown AMF type: " + type;
		}
		return value;
	},

	readBoolean: function() {
		return this.read() === 1;
	}
});