enyo.kind({
	name: "enyo.AmfWriter",
	kind: enyo.Object,

	constructor: function() {
		this.data = [];
		this.objects = [];
		this.traits = {};
		this.strings = {};
		this.stringCount = 0;
		this.traitCount = 0;
		this.objectCount = 0;
	},

	write: function(v) {
		this.data.push(v);
	},
	
	writeShort: function(v) {
		this.write((v >>> 8) & 255);
		this.write((v >>> 0) & 255);
	},
	
	writeUTF: function(v, asAmf) {
		var bytearr, c, i, strlen, utflen;
		strlen = v.length;
		utflen = 0;
		for (i = 0; i < strlen; i++) {
			c = v.charCodeAt(i);
			if (c > 0 && c < 128) {
				utflen++;
			} else if (c > 2047) {
				utflen += 3;
			} else {
				utflen += 2;
			}
		}
		bytearr = [];
		if (asAmf) {
			this.writeUInt29((utflen << 1) | 1);
		} else {
			bytearr.push((utflen >>> 8) & 255);
			bytearr.push(utflen & 255);
		}
		for (i = 0; i < strlen; i++) {
			c = v.charCodeAt(i);
			if (c > 0 && c < 128) {
				bytearr.push(c);
			} else if (c > 2047) {
				bytearr.push(224 | (c >> 12));
				bytearr.push(128 | ((c >> 6) & 63));
				if (asAmf) {
					bytearr.push(128 | ((c >> 0) & 63));
				} else {
					bytearr.push(128 | (c & 63));
				}
			} else {
				bytearr.push(192 | (c >> 6));
				if (asAmf) {
					bytearr.push(128 | ((c >> 0) & 63));
				} else {
					bytearr.push(128 | (c & 63));
				}
			}
		}
		this.writeAll(bytearr);
		return asAmf ? utflen : utflen + 2;
	},
	
	writeUInt29: function(v) {
		if (v < 128) {
			this.write(v);
		} else if (v < 16384) {
			this.write(((v >> 7) & 127) | 128);
			this.write(v & 127);
		} else if (v < 2097152) {
			this.write(((v >> 14) & 127) | 128);
			this.write(((v >> 7) & 127) | 128);
			this.write(v & 127);
		} else if (v < 0x40000000) {
			this.write(((v >> 22) & 127) | 128);
			this.write(((v >> 15) & 127) | 128);
			this.write(((v >> 8) & 127) | 128);
			this.write(v & 255);
		} else {
			throw "Integer out of range: " + v;
		}
	},
	
	writeAll: function(bytes) {
		for (var i = 0; i < bytes.length; i++) {
			this.write(bytes[i]);
		}
	},
	
	writeBoolean: function(v) {
		this.write(v ? 1 : 0);
	},
	
	writeInt: function(v) {
		this.write((v >>> 24) & 255);
		this.write((v >>> 16) & 255);
		this.write((v >>> 8) & 255);
		this.write((v >>> 0) & 255);
	},
	
	writeUnsignedInt: function(v) {
		v < 0 && (v = -(v ^ 4294967295) - 1);
		v &= 4294967295;
		this.write((v >> 24) & 255);
		this.write((v >> 16) & 255);
		this.write((v >> 8) & 255);
		this.write(v & 255);
	},
	
	_getDouble: function(v) {
		var r = [0,0];
		if (v != v) return r[0] = -524288, r;
		var d = v < 0 || v === 0 && 1 / v < 0 ? -2147483648 : 0, v = Math.abs(v);
		if (v === Number.POSITIVE_INFINITY) return r[0] = d | 2146435072, r;
		for (var e = 0; v >= 2 && e <= 1023;) e++, v /= 2;
		for (; v < 1 && e >= -1022;) e--, v *= 2;
		e += 1023;
		if (e == 2047) return r[0] = d | 2146435072, r;
		var i;
		e == 0
			? (i = v * Math.pow(2, 23) / 2, v = Math.round(v * Math.pow(2, 52) / 2))
			: (i = v * Math.pow(2, 20) - Math.pow(2, 20), v = Math.round(v * Math.pow(2, 52) - Math.pow(2, 52)));
		r[0] = d | e << 20 & 2147418112 | i & 1048575;
		r[1] = v;
		return r;
	},
	
	writeDouble: function(v) {
		v = this._getDouble(v);
		this.writeUnsignedInt(v[0]);
		this.writeUnsignedInt(v[1])
	},
	
	getResult: function() {
		return this.data.join("");
	},
	
	reset: function() {
		this.objects = [];
		this.objectCount = 0;
		this.traits = {};
		this.traitCount = 0;
		this.strings = {};
		this.stringCount = 0;
	},
	
	writeStringWithoutType: function(v) {
		if (v.length == 0) {
			this.writeUInt29(1);
		} else {
			if (!this.stringByReference(v)) {
				this.writeUTF(v, true);
			}
		}
	},
	
	stringByReference: function(v) {
		var ref = this.strings[v];
		if (ref) {
			this.writeUInt29(ref << 1);
		} else {
			this.strings[v] = this.stringCount++;
		}
		return ref;
	},
	
	objectByReference: function(v) {
		var ref = 0;
		var found = false;
		for (; ref < this.objects.length; ref++) {
			if (this.objects[ref] === v) {
				found = true;
				break;
			}
		}
		if (found) {
			this.writeUInt29(ref << 1);
		} else {
			this.objects.push(v);
			this.objectCount++;
		}
	
		return found ? ref : null;
	},
	
	traitsByReference: function(v, alias) {
		var s = alias + "|";
		for ( var i = 0; i < v.length; i++) {
			s += v[i] + "|";
		}
		var ref = this.traits[s];
		if (ref) {
			this.writeUInt29((ref << 2) | 1);
		} else {
			this.traits[s] = this.traitCount++;
		}
		return ref;
	},
	
	writeAmfInt: function(v) {
		if (v >= enyo.amf.CONST.INT28_MIN_VALUE && v <= enyo.amf.CONST.INT28_MAX_VALUE) {
			v = v & enyo.amf.CONST.UINT29_MASK;
			this.write(enyo.amf.CONST.INTEGER_TYPE);
			this.writeUInt29(v);
		} else {
			this.write(enyo.amf.CONST.DOUBLE_TYPE);
			this.writeDouble(v);
		}
	},
	
	writeDate: function(v) {
		this.write(enyo.amf.CONST.DATE_TYPE);
		if (!this.objectByReference(v)) {
			this.writeUInt29(1);
			this.writeDouble(v.getTime());
		}
	},
	
	writeObject: function(v) {
		if (v == null) {
			this.write(enyo.amf.CONST.NULL_TYPE);
			return;
		}
		if (v.constructor === String) {
			this.write(enyo.amf.CONST.STRING_TYPE);
			this.writeStringWithoutType(v);
		} else if (v.constructor === Number) {
			if (v === +v && v === (v | 0)) {
				this.writeAmfInt(v);
			} else {
				this.write(enyo.amf.CONST.DOUBLE_TYPE);
				this.writeDouble(v);
			}
		} else if (v.constructor === Boolean) {
			this.write((v
				? enyo.amf.CONST.TRUE_TYPE
				: enyo.amf.CONST.FALSE_TYPE));
		} else if (v.constructor === Date) {
			this.writeDate(v);
		} else {
			if (v.constructor === Array) {
				this.writeArray(v);
			} else if (enyo.amf.CONST.CLASS_ALIAS in v) {
				this.writeCustomObject(v);
			} else {
				this.writeMap(v);
			}
		}
	},
	
	writeCustomObject: function(v) {
		this.write(enyo.amf.CONST.OBJECT_TYPE);
		if (!this.objectByReference(v)) {
			var traits = this.writeTraits(v);
			for (var i = 0; i < traits.length; i++) {
				var prop = traits[i];
				this.writeObject(v[prop]);
			}
		}
	},
	
	writeTraits: function(v) {
		var traits = [];
		var count = 0;
		var externalizable = false;
		var dynamic = false;
	
		for (var t in v) {
			if (t != enyo.amf.CONST.CLASS_ALIAS) {
				traits.push(t);
				count++;
			}
		}
		if (!this.traitsByReference(traits, v[enyo.amf.CONST.CLASS_ALIAS])) {
			this.writeUInt29(3 | (externalizable ? 4 : 0) | (dynamic ? 8 : 0) | (count << 4));
			this.writeStringWithoutType(v[enyo.amf.CONST.CLASS_ALIAS]);
			if (count > 0) {
				for (var prop in traits) {
					this.writeStringWithoutType(traits[prop]);
				}
			}
		}
		return traits;
	},
	
	/* Write map as array
	writeMap: function(v) {
		this.write(enyo.amf.CONST.ARRAY_TYPE);
		if (!this.objectByReference(map)) {
			this.writeUInt29((0 << 1) | 1);
			for (var key in v) {
				if (key) {
					this.writeStringWithoutType(key);
				} else {
					this.writeStringWithoutType(enyo.amf.CONST.EMPTY_STRING);
				}
				this.writeObject(v[key]);
			}
			this.writeStringWithoutType(enyo.amf.CONST.EMPTY_STRING);
		}
	},*/
	
	writeMap: function(v) {
		this.write(enyo.amf.CONST.OBJECT_TYPE);
		if (!this.objectByReference(v)) {
			this.writeUInt29(11);
			this.traitCount++; //bogus traits entry here
			this.writeStringWithoutType(enyo.amf.CONST.EMPTY_STRING); //class name
			for (var key in v) {
				if (key) {
					this.writeStringWithoutType(key);
				} else {
					this.writeStringWithoutType(enyo.amf.CONST.EMPTY_STRING);
				}
				this.writeObject(v[key]);
			}
			this.writeStringWithoutType(enyo.amf.CONST.EMPTY_STRING); //empty string end of dynamic members
		}
	},
	
	writeArray: function(v) {
		this.write(enyo.amf.CONST.ARRAY_TYPE);
		if (!this.objectByReference(v)) {
			this.writeUInt29((v.length << 1) | 1);
			this.writeUInt29(1); //empty string implying no named keys
			if (v.length > 0) {
				for (var i = 0; i < v.length; i++) {
					this.writeObject(v[i]);
				}
			}
		}
	}
});