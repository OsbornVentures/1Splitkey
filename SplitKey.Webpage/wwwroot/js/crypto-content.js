﻿if (typeof Crypto == "undefined" || !Crypto.util) {
	(function () {

		var base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

		// Global Crypto object
		var Crypto = window.Crypto = {};

		// Crypto utilities
		var util = Crypto.util = {

			// Bit-wise rotate left
			rotl: function (n, b) {
				return (n << b) | (n >>> (32 - b));
			},

			// Bit-wise rotate right
			rotr: function (n, b) {
				return (n << (32 - b)) | (n >>> b);
			},

			// Swap big-endian to little-endian and vice versa
			endian: function (n) {

				// If number given, swap endian
				if (n.constructor == Number) {
					return util.rotl(n, 8) & 0x00FF00FF |
			    util.rotl(n, 24) & 0xFF00FF00;
				}

				// Else, assume array and swap all items
				for (var i = 0; i < n.length; i++)
					n[i] = util.endian(n[i]);
				return n;

			},

			// Generate an array of any length of random bytes
			randomBytes: function (n) {
				for (var bytes = []; n > 0; n--)
					bytes.push(Math.floor(Math.random() * 256));
				return bytes;
			},

			// Convert a byte array to big-endian 32-bit words
			bytesToWords: function (bytes) {
				for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
					words[b >>> 5] |= (bytes[i] & 0xFF) << (24 - b % 32);
				return words;
			},

			// Convert big-endian 32-bit words to a byte array
			wordsToBytes: function (words) {
				for (var bytes = [], b = 0; b < words.length * 32; b += 8)
					bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
				return bytes;
			},

			// Convert a byte array to a hex string
			bytesToHex: function (bytes) {
				for (var hex = [], i = 0; i < bytes.length; i++) {
					hex.push((bytes[i] >>> 4).toString(16));
					hex.push((bytes[i] & 0xF).toString(16));
				}
				return hex.join("");
			},

			// Convert a hex string to a byte array
			hexToBytes: function (hex) {
				for (var bytes = [], c = 0; c < hex.length; c += 2)
					bytes.push(parseInt(hex.substr(c, 2), 16));
				return bytes;
			},

			// Convert a byte array to a base-64 string
			bytesToBase64: function (bytes) {
				for (var base64 = [], i = 0; i < bytes.length; i += 3) {
					var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
					for (var j = 0; j < 4; j++) {
						if (i * 8 + j * 6 <= bytes.length * 8)
							base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
						else base64.push("=");
					}
				}

				return base64.join("");
			},

			// Convert a base-64 string to a byte array
			base64ToBytes: function (base64) {
				// Remove non-base-64 characters
				base64 = base64.replace(/[^A-Z0-9+\/]/ig, "");

				for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
					if (imod4 == 0) continue;
					bytes.push(((base64map.indexOf(base64.charAt(i - 1)) & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2)) |
			        (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
				}

				return bytes;
			}

		};

		// Crypto character encodings
		var charenc = Crypto.charenc = {};

		// UTF-8 encoding
		var UTF8 = charenc.UTF8 = {

			// Convert a string to a byte array
			stringToBytes: function (str) {
				return Binary.stringToBytes(unescape(encodeURIComponent(str)));
			},

			// Convert a byte array to a string
			bytesToString: function (bytes) {
				return decodeURIComponent(escape(Binary.bytesToString(bytes)));
			}

		};

		// Binary encoding
		var Binary = charenc.Binary = {

			// Convert a string to a byte array
			stringToBytes: function (str) {
				for (var bytes = [], i = 0; i < str.length; i++)
					bytes.push(str.charCodeAt(i) & 0xFF);
				return bytes;
			},

			// Convert a byte array to a string
			bytesToString: function (bytes) {
				for (var str = [], i = 0; i < bytes.length; i++)
					str.push(String.fromCharCode(bytes[i]));
				return str.join("");
			}

		};

	})();
}

(function () {

	// Shortcuts
	var C = Crypto,
		util = C.util,
		charenc = C.charenc,
		UTF8 = charenc.UTF8,
		Binary = charenc.Binary;

	// Constants
	var K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
        0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
        0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
        0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
        0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
        0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
        0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
        0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
        0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
        0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
        0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
        0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
        0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
        0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
        0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
        0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];

	// Public API
	var SHA256 = C.SHA256 = function (message, options) {
		var digestbytes = util.wordsToBytes(SHA256._sha256(message));
		return options && options.asBytes ? digestbytes :
	    options && options.asString ? Binary.bytesToString(digestbytes) :
	    util.bytesToHex(digestbytes);
	};

	// The core
	SHA256._sha256 = function (message) {

		// Convert to byte array
		if (message.constructor == String) message = UTF8.stringToBytes(message);
		/* else, assume byte array already */

		var m = util.bytesToWords(message),
		l = message.length * 8,
		H = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
				0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19],
		w = [],
		a, b, c, d, e, f, g, h, i, j,
		t1, t2;

		// Padding
		m[l >> 5] |= 0x80 << (24 - l % 32);
		m[((l + 64 >> 9) << 4) + 15] = l;

		for (var i = 0; i < m.length; i += 16) {

			a = H[0];
			b = H[1];
			c = H[2];
			d = H[3];
			e = H[4];
			f = H[5];
			g = H[6];
			h = H[7];

			for (var j = 0; j < 64; j++) {

				if (j < 16) w[j] = m[j + i];
				else {

					var gamma0x = w[j - 15],
				gamma1x = w[j - 2],
				gamma0 = ((gamma0x << 25) | (gamma0x >>> 7)) ^
				            ((gamma0x << 14) | (gamma0x >>> 18)) ^
				            (gamma0x >>> 3),
				gamma1 = ((gamma1x << 15) | (gamma1x >>> 17)) ^
				            ((gamma1x << 13) | (gamma1x >>> 19)) ^
				            (gamma1x >>> 10);

					w[j] = gamma0 + (w[j - 7] >>> 0) +
				    gamma1 + (w[j - 16] >>> 0);

				}

				var ch = e & f ^ ~e & g,
			maj = a & b ^ a & c ^ b & c,
			sigma0 = ((a << 30) | (a >>> 2)) ^
			            ((a << 19) | (a >>> 13)) ^
			            ((a << 10) | (a >>> 22)),
			sigma1 = ((e << 26) | (e >>> 6)) ^
			            ((e << 21) | (e >>> 11)) ^
			            ((e << 7) | (e >>> 25));


				t1 = (h >>> 0) + sigma1 + ch + (K[j]) + (w[j] >>> 0);
				t2 = sigma0 + maj;

				h = g;
				g = f;
				f = e;
				e = (d + t1) >>> 0;
				d = c;
				c = b;
				b = a;
				a = (t1 + t2) >>> 0;

			}

			H[0] += a;
			H[1] += b;
			H[2] += c;
			H[3] += d;
			H[4] += e;
			H[5] += f;
			H[6] += g;
			H[7] += h;

		}

		return H;

	};

	// Package private blocksize
	SHA256._blocksize = 16;

	SHA256._digestsize = 32;

})();

(function () {

	// Shortcuts
	var C = Crypto,
		util = C.util,
		charenc = C.charenc,
		UTF8 = charenc.UTF8,
		Binary = charenc.Binary;

	C.PBKDF2 = function (password, salt, keylen, options) {

		// Convert to byte arrays
		if (password.constructor == String) password = UTF8.stringToBytes(password);
		if (salt.constructor == String) salt = UTF8.stringToBytes(salt);
		/* else, assume byte arrays already */

		// Defaults
		var hasher = options && options.hasher || C.SHA1,
			iterations = options && options.iterations || 1;

		// Pseudo-random function
		function PRF(password, salt) {
			return C.HMAC(hasher, salt, password, { asBytes: true });
		}

		// Generate key
		var derivedKeyBytes = [],
			blockindex = 1;
		while (derivedKeyBytes.length < keylen) {
			var block = PRF(password, salt.concat(util.wordsToBytes([blockindex])));
			for (var u = block, i = 1; i < iterations; i++) {
				u = PRF(password, u);
				for (var j = 0; j < block.length; j++) block[j] ^= u[j];
			}
			derivedKeyBytes = derivedKeyBytes.concat(block);
			blockindex++;
		}

		// Truncate excess bytes
		derivedKeyBytes.length = keylen;

		return options && options.asBytes ? derivedKeyBytes :
		options && options.asString ? Binary.bytesToString(derivedKeyBytes) :
		util.bytesToHex(derivedKeyBytes);

	};

})();

(function () {

	// Shortcuts
	var C = Crypto,
		util = C.util,
		charenc = C.charenc,
		UTF8 = charenc.UTF8,
		Binary = charenc.Binary;

	C.HMAC = function (hasher, message, key, options) {

		// Convert to byte arrays
		if (message.constructor == String) message = UTF8.stringToBytes(message);
		if (key.constructor == String) key = UTF8.stringToBytes(key);
		/* else, assume byte arrays already */

		// Allow arbitrary length keys
		if (key.length > hasher._blocksize * 4)
			key = hasher(key, { asBytes: true });

		// XOR keys with pad constants
		var okey = key.slice(0),
			ikey = key.slice(0);
		for (var i = 0; i < hasher._blocksize * 4; i++) {
			okey[i] ^= 0x5C;
			ikey[i] ^= 0x36;
		}

		var hmacbytes = hasher(okey.concat(hasher(ikey.concat(message), { asBytes: true })), { asBytes: true });

		return options && options.asBytes ? hmacbytes :
		options && options.asString ? Binary.bytesToString(hmacbytes) :
		util.bytesToHex(hmacbytes);

	};

})();

(function () {

	// Shortcuts
	var C = Crypto,
		util = C.util,
		charenc = C.charenc,
		UTF8 = charenc.UTF8;

	// Precomputed SBOX
	var SBOX = [0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5,
            0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
            0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0,
            0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
            0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc,
            0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
            0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a,
            0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
            0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0,
            0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
            0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b,
            0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
            0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85,
            0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
            0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5,
            0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
            0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17,
            0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
            0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88,
            0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
            0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c,
            0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
            0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9,
            0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
            0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6,
            0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
            0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e,
            0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
            0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94,
            0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
            0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68,
            0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16];

	// Compute inverse SBOX lookup table
	for (var INVSBOX = [], i = 0; i < 256; i++) INVSBOX[SBOX[i]] = i;

	// Compute multiplication in GF(2^8) lookup tables
	var MULT2 = [],
		MULT3 = [],
		MULT9 = [],
		MULTB = [],
		MULTD = [],
		MULTE = [];

	function xtime(a, b) {
		for (var result = 0, i = 0; i < 8; i++) {
			if (b & 1) result ^= a;
			var hiBitSet = a & 0x80;
			a = (a << 1) & 0xFF;
			if (hiBitSet) a ^= 0x1b;
			b >>>= 1;
		}
		return result;
	}

	for (var i = 0; i < 256; i++) {
		MULT2[i] = xtime(i, 2);
		MULT3[i] = xtime(i, 3);
		MULT9[i] = xtime(i, 9);
		MULTB[i] = xtime(i, 0xB);
		MULTD[i] = xtime(i, 0xD);
		MULTE[i] = xtime(i, 0xE);
	}

	// Precomputed RCon lookup
	var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

	// Inner state
	var state = [[], [], [], []],
		keylength,
		nrounds,
		keyschedule;

	var AES = C.AES = {

		/**
		* Public API
		*/

		encrypt: function (message, password, options) {

			options = options || {};

			// Determine mode
			var mode = options.mode || new C.mode.OFB;

			// Allow mode to override options
			if (mode.fixOptions) mode.fixOptions(options);

			var

			// Convert to bytes if message is a string
		m = (
			message.constructor == String ?
			UTF8.stringToBytes(message) :
			message
		),

			// Generate random IV
		iv = options.iv || util.randomBytes(AES._blocksize * 4),

			// Generate key
		k = (
			password.constructor == String ?
			// Derive key from pass-phrase
			C.PBKDF2(password, iv, 32, { asBytes: true }) :
			// else, assume byte array representing cryptographic key
			password
		);

			// Encrypt
			AES._init(k);
			mode.encrypt(AES, m, iv);

			// Return ciphertext
			m = options.iv ? m : iv.concat(m);
			return (options && options.asBytes) ? m : util.bytesToBase64(m);

		},

		decrypt: function (ciphertext, password, options) {

			options = options || {};

			// Determine mode
			var mode = options.mode || new C.mode.OFB;

			// Allow mode to override options
			if (mode.fixOptions) mode.fixOptions(options);

			var

			// Convert to bytes if ciphertext is a string
		c = (
			ciphertext.constructor == String ?
			util.base64ToBytes(ciphertext) :
			ciphertext
		),

			// Separate IV and message
		iv = options.iv || c.splice(0, AES._blocksize * 4),

			// Generate key
		k = (
			password.constructor == String ?
			// Derive key from pass-phrase
			C.PBKDF2(password, iv, 32, { asBytes: true }) :
			// else, assume byte array representing cryptographic key
			password
		);

			// Decrypt
			AES._init(k);
			mode.decrypt(AES, c, iv);

			// Return plaintext
			return (options && options.asBytes) ? c : UTF8.bytesToString(c);

		},


		/**
		* Package private methods and properties
		*/

		_blocksize: 4,

		_encryptblock: function (m, offset) {

			// Set input
			for (var row = 0; row < AES._blocksize; row++) {
				for (var col = 0; col < 4; col++)
					state[row][col] = m[offset + col * 4 + row];
			}

			// Add round key
			for (var row = 0; row < 4; row++) {
				for (var col = 0; col < 4; col++)
					state[row][col] ^= keyschedule[col][row];
			}

			for (var round = 1; round < nrounds; round++) {

				// Sub bytes
				for (var row = 0; row < 4; row++) {
					for (var col = 0; col < 4; col++)
						state[row][col] = SBOX[state[row][col]];
				}

				// Shift rows
				state[1].push(state[1].shift());
				state[2].push(state[2].shift());
				state[2].push(state[2].shift());
				state[3].unshift(state[3].pop());

				// Mix columns
				for (var col = 0; col < 4; col++) {

					var s0 = state[0][col],
				s1 = state[1][col],
				s2 = state[2][col],
				s3 = state[3][col];

					state[0][col] = MULT2[s0] ^ MULT3[s1] ^ s2 ^ s3;
					state[1][col] = s0 ^ MULT2[s1] ^ MULT3[s2] ^ s3;
					state[2][col] = s0 ^ s1 ^ MULT2[s2] ^ MULT3[s3];
					state[3][col] = MULT3[s0] ^ s1 ^ s2 ^ MULT2[s3];

				}

				// Add round key
				for (var row = 0; row < 4; row++) {
					for (var col = 0; col < 4; col++)
						state[row][col] ^= keyschedule[round * 4 + col][row];
				}

			}

			// Sub bytes
			for (var row = 0; row < 4; row++) {
				for (var col = 0; col < 4; col++)
					state[row][col] = SBOX[state[row][col]];
			}

			// Shift rows
			state[1].push(state[1].shift());
			state[2].push(state[2].shift());
			state[2].push(state[2].shift());
			state[3].unshift(state[3].pop());

			// Add round key
			for (var row = 0; row < 4; row++) {
				for (var col = 0; col < 4; col++)
					state[row][col] ^= keyschedule[nrounds * 4 + col][row];
			}

			// Set output
			for (var row = 0; row < AES._blocksize; row++) {
				for (var col = 0; col < 4; col++)
					m[offset + col * 4 + row] = state[row][col];
			}

		},

		_decryptblock: function (c, offset) {

			// Set input
			for (var row = 0; row < AES._blocksize; row++) {
				for (var col = 0; col < 4; col++)
					state[row][col] = c[offset + col * 4 + row];
			}

			// Add round key
			for (var row = 0; row < 4; row++) {
				for (var col = 0; col < 4; col++)
					state[row][col] ^= keyschedule[nrounds * 4 + col][row];
			}

			for (var round = 1; round < nrounds; round++) {

				// Inv shift rows
				state[1].unshift(state[1].pop());
				state[2].push(state[2].shift());
				state[2].push(state[2].shift());
				state[3].push(state[3].shift());

				// Inv sub bytes
				for (var row = 0; row < 4; row++) {
					for (var col = 0; col < 4; col++)
						state[row][col] = INVSBOX[state[row][col]];
				}

				// Add round key
				for (var row = 0; row < 4; row++) {
					for (var col = 0; col < 4; col++)
						state[row][col] ^= keyschedule[(nrounds - round) * 4 + col][row];
				}

				// Inv mix columns
				for (var col = 0; col < 4; col++) {

					var s0 = state[0][col],
				s1 = state[1][col],
				s2 = state[2][col],
				s3 = state[3][col];

					state[0][col] = MULTE[s0] ^ MULTB[s1] ^ MULTD[s2] ^ MULT9[s3];
					state[1][col] = MULT9[s0] ^ MULTE[s1] ^ MULTB[s2] ^ MULTD[s3];
					state[2][col] = MULTD[s0] ^ MULT9[s1] ^ MULTE[s2] ^ MULTB[s3];
					state[3][col] = MULTB[s0] ^ MULTD[s1] ^ MULT9[s2] ^ MULTE[s3];

				}

			}

			// Inv shift rows
			state[1].unshift(state[1].pop());
			state[2].push(state[2].shift());
			state[2].push(state[2].shift());
			state[3].push(state[3].shift());

			// Inv sub bytes
			for (var row = 0; row < 4; row++) {
				for (var col = 0; col < 4; col++)
					state[row][col] = INVSBOX[state[row][col]];
			}

			// Add round key
			for (var row = 0; row < 4; row++) {
				for (var col = 0; col < 4; col++)
					state[row][col] ^= keyschedule[col][row];
			}

			// Set output
			for (var row = 0; row < AES._blocksize; row++) {
				for (var col = 0; col < 4; col++)
					c[offset + col * 4 + row] = state[row][col];
			}

		},


		/**
		* Private methods
		*/

		_init: function (k) {
			keylength = k.length / 4;
			nrounds = keylength + 6;
			AES._keyexpansion(k);
		},

		// Generate a key schedule
		_keyexpansion: function (k) {

			keyschedule = [];

			for (var row = 0; row < keylength; row++) {
				keyschedule[row] = [
			k[row * 4],
			k[row * 4 + 1],
			k[row * 4 + 2],
			k[row * 4 + 3]
		];
			}

			for (var row = keylength; row < AES._blocksize * (nrounds + 1); row++) {

				var temp = [
			keyschedule[row - 1][0],
			keyschedule[row - 1][1],
			keyschedule[row - 1][2],
			keyschedule[row - 1][3]
		];

				if (row % keylength == 0) {

					// Rot word
					temp.push(temp.shift());

					// Sub word
					temp[0] = SBOX[temp[0]];
					temp[1] = SBOX[temp[1]];
					temp[2] = SBOX[temp[2]];
					temp[3] = SBOX[temp[3]];

					temp[0] ^= RCON[row / keylength];

				} else if (keylength > 6 && row % keylength == 4) {

					// Sub word
					temp[0] = SBOX[temp[0]];
					temp[1] = SBOX[temp[1]];
					temp[2] = SBOX[temp[2]];
					temp[3] = SBOX[temp[3]];

				}

				keyschedule[row] = [
			keyschedule[row - keylength][0] ^ temp[0],
			keyschedule[row - keylength][1] ^ temp[1],
			keyschedule[row - keylength][2] ^ temp[2],
			keyschedule[row - keylength][3] ^ temp[3]
		];

			}

		}

	};

})();

(function (C) {

	// Create pad namespace
	var C_pad = C.pad = {};

	// Calculate the number of padding bytes required.
	function _requiredPadding(cipher, message) {
		var blockSizeInBytes = cipher._blocksize * 4;
		var reqd = blockSizeInBytes - message.length % blockSizeInBytes;
		return reqd;
	}

	// Remove padding when the final byte gives the number of padding bytes.
	var _unpadLength = function (cipher, message, alg, padding) {
		var pad = message.pop();
		if (pad == 0) {
			throw new Error("Invalid zero-length padding specified for " + alg
			+ ". Wrong cipher specification or key used?");
		}
		var maxPad = cipher._blocksize * 4;
		if (pad > maxPad) {
			throw new Error("Invalid padding length of " + pad
			+ " specified for " + alg
			+ ". Wrong cipher specification or key used?");
		}
		for (var i = 1; i < pad; i++) {
			var b = message.pop();
			if (padding != undefined && padding != b) {
				throw new Error("Invalid padding byte of 0x" + b.toString(16)
				+ " specified for " + alg
				+ ". Wrong cipher specification or key used?");
			}
		}
	};

	// No-operation padding, used for stream ciphers
	C_pad.NoPadding = {
		pad: function (cipher, message) { },
		unpad: function (cipher, message) { }
	};

	// Zero Padding.
	//
	// If the message is not an exact number of blocks, the final block is
	// completed with 0x00 bytes. There is no unpadding.
	C_pad.ZeroPadding = {
		pad: function (cipher, message) {
			var blockSizeInBytes = cipher._blocksize * 4;
			var reqd = message.length % blockSizeInBytes;
			if (reqd != 0) {
				for (reqd = blockSizeInBytes - reqd; reqd > 0; reqd--) {
					message.push(0x00);
				}
			}
		},

		unpad: function (cipher, message) {
			while (message[message.length - 1] == 0) {
				message.pop();
			}
		}
	};

	// ISO/IEC 7816-4 padding.
	//
	// Pads the plain text with an 0x80 byte followed by as many 0x00
	// bytes are required to complete the block.
	C_pad.iso7816 = {
		pad: function (cipher, message) {
			var reqd = _requiredPadding(cipher, message);
			message.push(0x80);
			for (; reqd > 1; reqd--) {
				message.push(0x00);
			}
		},

		unpad: function (cipher, message) {
			var padLength;
			for (padLength = cipher._blocksize * 4; padLength > 0; padLength--) {
				var b = message.pop();
				if (b == 0x80) return;
				if (b != 0x00) {
					throw new Error("ISO-7816 padding byte must be 0, not 0x" + b.toString(16) + ". Wrong cipher specification or key used?");
				}
			}
			throw new Error("ISO-7816 padded beyond cipher block size. Wrong cipher specification or key used?");
		}
	};

	// ANSI X.923 padding
	//
	// The final block is padded with zeros except for the last byte of the
	// last block which contains the number of padding bytes.
	C_pad.ansix923 = {
		pad: function (cipher, message) {
			var reqd = _requiredPadding(cipher, message);
			for (var i = 1; i < reqd; i++) {
				message.push(0x00);
			}
			message.push(reqd);
		},

		unpad: function (cipher, message) {
			_unpadLength(cipher, message, "ANSI X.923", 0);
		}
	};

	// ISO 10126
	//
	// The final block is padded with random bytes except for the last
	// byte of the last block which contains the number of padding bytes.
	C_pad.iso10126 = {
		pad: function (cipher, message) {
			var reqd = _requiredPadding(cipher, message);
			for (var i = 1; i < reqd; i++) {
				message.push(Math.floor(Math.random() * 256));
			}
			message.push(reqd);
		},

		unpad: function (cipher, message) {
			_unpadLength(cipher, message, "ISO 10126", undefined);
		}
	};

	// PKCS7 padding
	//
	// PKCS7 is described in RFC 5652. Padding is in whole bytes. The
	// value of each added byte is the number of bytes that are added,
	// i.e. N bytes, each of value N are added.
	C_pad.pkcs7 = {
		pad: function (cipher, message) {
			var reqd = _requiredPadding(cipher, message);
			for (var i = 0; i < reqd; i++) {
				message.push(reqd);
			}
		},

		unpad: function (cipher, message) {
			_unpadLength(cipher, message, "PKCS 7", message[message.length - 1]);
		}
	};

	// Create mode namespace
	var C_mode = C.mode = {};

	/**
	* Mode base "class".
	*/
	var Mode = C_mode.Mode = function (padding) {
		if (padding) {
			this._padding = padding;
		}
	};

	Mode.prototype = {
		encrypt: function (cipher, m, iv) {
			this._padding.pad(cipher, m);
			this._doEncrypt(cipher, m, iv);
		},

		decrypt: function (cipher, m, iv) {
			this._doDecrypt(cipher, m, iv);
			this._padding.unpad(cipher, m);
		},

		// Default padding
		_padding: C_pad.iso7816
	};


	/**
	* Electronic Code Book mode.
	*
	* ECB applies the cipher directly against each block of the input.
	*
	* ECB does not require an initialization vector.
	*/
	var ECB = C_mode.ECB = function () {
		// Call parent constructor
		Mode.apply(this, arguments);
	};

	// Inherit from Mode
	var ECB_prototype = ECB.prototype = new Mode;

	// Concrete steps for Mode template
	ECB_prototype._doEncrypt = function (cipher, m, iv) {
		var blockSizeInBytes = cipher._blocksize * 4;
		// Encrypt each block
		for (var offset = 0; offset < m.length; offset += blockSizeInBytes) {
			cipher._encryptblock(m, offset);
		}
	};
	ECB_prototype._doDecrypt = function (cipher, c, iv) {
		var blockSizeInBytes = cipher._blocksize * 4;
		// Decrypt each block
		for (var offset = 0; offset < c.length; offset += blockSizeInBytes) {
			cipher._decryptblock(c, offset);
		}
	};

	// ECB never uses an IV
	ECB_prototype.fixOptions = function (options) {
		options.iv = [];
	};


	/**
	* Cipher block chaining
	*
	* The first block is XORed with the IV. Subsequent blocks are XOR with the
	* previous cipher output.
	*/
	var CBC = C_mode.CBC = function () {
		// Call parent constructor
		Mode.apply(this, arguments);
	};

	// Inherit from Mode
	var CBC_prototype = CBC.prototype = new Mode;

	// Concrete steps for Mode template
	CBC_prototype._doEncrypt = function (cipher, m, iv) {
		var blockSizeInBytes = cipher._blocksize * 4;

		// Encrypt each block
		for (var offset = 0; offset < m.length; offset += blockSizeInBytes) {
			if (offset == 0) {
				// XOR first block using IV
				for (var i = 0; i < blockSizeInBytes; i++)
					m[i] ^= iv[i];
			} else {
				// XOR this block using previous crypted block
				for (var i = 0; i < blockSizeInBytes; i++)
					m[offset + i] ^= m[offset + i - blockSizeInBytes];
			}
			// Encrypt block
			cipher._encryptblock(m, offset);
		}
	};
	CBC_prototype._doDecrypt = function (cipher, c, iv) {
		var blockSizeInBytes = cipher._blocksize * 4;

		// At the start, the previously crypted block is the IV
		var prevCryptedBlock = iv;

		// Decrypt each block
		for (var offset = 0; offset < c.length; offset += blockSizeInBytes) {
			// Save this crypted block
			var thisCryptedBlock = c.slice(offset, offset + blockSizeInBytes);
			// Decrypt block
			cipher._decryptblock(c, offset);
			// XOR decrypted block using previous crypted block
			for (var i = 0; i < blockSizeInBytes; i++) {
				c[offset + i] ^= prevCryptedBlock[i];
			}
			prevCryptedBlock = thisCryptedBlock;
		}
	};


	/**
	* Cipher feed back
	*
	* The cipher output is XORed with the plain text to produce the cipher output,
	* which is then fed back into the cipher to produce a bit pattern to XOR the
	* next block with.
	*
	* This is a stream cipher mode and does not require padding.
	*/
	var CFB = C_mode.CFB = function () {
		// Call parent constructor
		Mode.apply(this, arguments);
	};

	// Inherit from Mode
	var CFB_prototype = CFB.prototype = new Mode;

	// Override padding
	CFB_prototype._padding = C_pad.NoPadding;

	// Concrete steps for Mode template
	CFB_prototype._doEncrypt = function (cipher, m, iv) {
		var blockSizeInBytes = cipher._blocksize * 4,
    keystream = iv.slice(0);

		// Encrypt each byte
		for (var i = 0; i < m.length; i++) {

			var j = i % blockSizeInBytes;
			if (j == 0) cipher._encryptblock(keystream, 0);

			m[i] ^= keystream[j];
			keystream[j] = m[i];
		}
	};
	CFB_prototype._doDecrypt = function (cipher, c, iv) {
		var blockSizeInBytes = cipher._blocksize * 4,
			keystream = iv.slice(0);

		// Encrypt each byte
		for (var i = 0; i < c.length; i++) {

			var j = i % blockSizeInBytes;
			if (j == 0) cipher._encryptblock(keystream, 0);

			var b = c[i];
			c[i] ^= keystream[j];
			keystream[j] = b;
		}
	};


	/**
	* Output feed back
	*
	* The cipher repeatedly encrypts its own output. The output is XORed with the
	* plain text to produce the cipher text.
	*
	* This is a stream cipher mode and does not require padding.
	*/
	var OFB = C_mode.OFB = function () {
		// Call parent constructor
		Mode.apply(this, arguments);
	};

	// Inherit from Mode
	var OFB_prototype = OFB.prototype = new Mode;

	// Override padding
	OFB_prototype._padding = C_pad.NoPadding;

	// Concrete steps for Mode template
	OFB_prototype._doEncrypt = function (cipher, m, iv) {

		var blockSizeInBytes = cipher._blocksize * 4,
			keystream = iv.slice(0);

		// Encrypt each byte
		for (var i = 0; i < m.length; i++) {

			// Generate keystream
			if (i % blockSizeInBytes == 0)
				cipher._encryptblock(keystream, 0);

			// Encrypt byte
			m[i] ^= keystream[i % blockSizeInBytes];

		}
	};
	OFB_prototype._doDecrypt = OFB_prototype._doEncrypt;

	var CTR = C_mode.CTR = function () {
		// Call parent constructor
		Mode.apply(this, arguments);
	};

	// Inherit from Mode
	var CTR_prototype = CTR.prototype = new Mode;

	// Override padding
	CTR_prototype._padding = C_pad.NoPadding;

	CTR_prototype._doEncrypt = function (cipher, m, iv) {
		var blockSizeInBytes = cipher._blocksize * 4;
		var counter = iv.slice(0);

		for (var i = 0; i < m.length; ) {
			// do not lose iv
			var keystream = counter.slice(0);

			// Generate keystream for next block
			cipher._encryptblock(keystream, 0);

			// XOR keystream with block
			for (var j = 0; i < m.length && j < blockSizeInBytes; j++, i++) {
				m[i] ^= keystream[j];
			}

			// Increase counter
			if (++(counter[blockSizeInBytes - 1]) == 256) {
				counter[blockSizeInBytes - 1] = 0;
				if (++(counter[blockSizeInBytes - 2]) == 256) {
					counter[blockSizeInBytes - 2] = 0;
					if (++(counter[blockSizeInBytes - 3]) == 256) {
						counter[blockSizeInBytes - 3] = 0;
						++(counter[blockSizeInBytes - 4]);
					}
				}
			}
		}
	};
	CTR_prototype._doDecrypt = CTR_prototype._doEncrypt;

})(Crypto);

(function () {
	// Shortcuts
	var C = Crypto,
	util = C.util,
	charenc = C.charenc,
	UTF8 = charenc.UTF8,
	Binary = charenc.Binary;

	// Convert a byte array to little-endian 32-bit words
	util.bytesToLWords = function (bytes) {

		var output = Array(bytes.length >> 2);
		for (var i = 0; i < output.length; i++)
			output[i] = 0;
		for (var i = 0; i < bytes.length * 8; i += 8)
			output[i >> 5] |= (bytes[i / 8] & 0xFF) << (i % 32);
		return output;
	};

	// Convert little-endian 32-bit words to a byte array
	util.lWordsToBytes = function (words) {
		var output = [];
		for (var i = 0; i < words.length * 32; i += 8)
			output.push((words[i >> 5] >>> (i % 32)) & 0xff);
		return output;
	};

	// Public API
	var RIPEMD160 = C.RIPEMD160 = function (message, options) {
		var digestbytes = util.lWordsToBytes(RIPEMD160._rmd160(message));
		return options && options.asBytes ? digestbytes :
			options && options.asString ? Binary.bytesToString(digestbytes) :
			util.bytesToHex(digestbytes);
	};

	// The core
	RIPEMD160._rmd160 = function (message) {
		// Convert to byte array
		if (message.constructor == String) message = UTF8.stringToBytes(message);

		var x = util.bytesToLWords(message),
			len = message.length * 8;

		/* append padding */
		x[len >> 5] |= 0x80 << (len % 32);
		x[(((len + 64) >>> 9) << 4) + 14] = len;

		var h0 = 0x67452301;
		var h1 = 0xefcdab89;
		var h2 = 0x98badcfe;
		var h3 = 0x10325476;
		var h4 = 0xc3d2e1f0;

		for (var i = 0; i < x.length; i += 16) {
			var T;
			var A1 = h0, B1 = h1, C1 = h2, D1 = h3, E1 = h4;
			var A2 = h0, B2 = h1, C2 = h2, D2 = h3, E2 = h4;
			for (var j = 0; j <= 79; ++j) {
				T = safe_add(A1, rmd160_f(j, B1, C1, D1));
				T = safe_add(T, x[i + rmd160_r1[j]]);
				T = safe_add(T, rmd160_K1(j));
				T = safe_add(bit_rol(T, rmd160_s1[j]), E1);
				A1 = E1; E1 = D1; D1 = bit_rol(C1, 10); C1 = B1; B1 = T;
				T = safe_add(A2, rmd160_f(79 - j, B2, C2, D2));
				T = safe_add(T, x[i + rmd160_r2[j]]);
				T = safe_add(T, rmd160_K2(j));
				T = safe_add(bit_rol(T, rmd160_s2[j]), E2);
				A2 = E2; E2 = D2; D2 = bit_rol(C2, 10); C2 = B2; B2 = T;
			}
			T = safe_add(h1, safe_add(C1, D2));
			h1 = safe_add(h2, safe_add(D1, E2));
			h2 = safe_add(h3, safe_add(E1, A2));
			h3 = safe_add(h4, safe_add(A1, B2));
			h4 = safe_add(h0, safe_add(B1, C2));
			h0 = T;
		}
		return [h0, h1, h2, h3, h4];
	}

	function rmd160_f(j, x, y, z) {
		return (0 <= j && j <= 15) ? (x ^ y ^ z) :
			(16 <= j && j <= 31) ? (x & y) | (~x & z) :
			(32 <= j && j <= 47) ? (x | ~y) ^ z :
			(48 <= j && j <= 63) ? (x & z) | (y & ~z) :
			(64 <= j && j <= 79) ? x ^ (y | ~z) :
			"rmd160_f: j out of range";
	}
	function rmd160_K1(j) {
		return (0 <= j && j <= 15) ? 0x00000000 :
			(16 <= j && j <= 31) ? 0x5a827999 :
			(32 <= j && j <= 47) ? 0x6ed9eba1 :
			(48 <= j && j <= 63) ? 0x8f1bbcdc :
			(64 <= j && j <= 79) ? 0xa953fd4e :
			"rmd160_K1: j out of range";
	}
	function rmd160_K2(j) {
		return (0 <= j && j <= 15) ? 0x50a28be6 :
			(16 <= j && j <= 31) ? 0x5c4dd124 :
			(32 <= j && j <= 47) ? 0x6d703ef3 :
			(48 <= j && j <= 63) ? 0x7a6d76e9 :
			(64 <= j && j <= 79) ? 0x00000000 :
			"rmd160_K2: j out of range";
	}
	var rmd160_r1 = [
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
		7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
		3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
		1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
		4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
	];
	var rmd160_r2 = [
		5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
		6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
		15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
		8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
		12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
	];
	var rmd160_s1 = [
		11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
		7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
		11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
		11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
		9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
	];
	var rmd160_s2 = [
		8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
		9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
		9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
		15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
		8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
	];

	/*
	* Add integers, wrapping at 2^32. This uses 16-bit operations internally
	* to work around bugs in some JS interpreters.
	*/
	function safe_add(x, y) {
		var lsw = (x & 0xFFFF) + (y & 0xFFFF);
		var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
	}

	/*
	* Bitwise rotate a 32-bit number to the left.
	*/
	function bit_rol(num, cnt) {
		return (num << cnt) | (num >>> (32 - cnt));
	}
})();

(function () {

	// Constructor function of Global SecureRandom object
	var sr = window.SecureRandom = function () { };

	// Properties
	sr.state;
	sr.pool;
	sr.pptr;
	sr.poolCopyOnInit;

	// Pool size must be a multiple of 4 and greater than 32.
	// An array of bytes the size of the pool will be passed to init()
	sr.poolSize = 256;

	// --- object methods ---

	// public method
	// ba: byte array
	sr.prototype.nextBytes = function (ba) {
		var i;
		if (window.crypto && window.crypto.getRandomValues && window.Uint8Array) {
			try {
				var rvBytes = new Uint8Array(ba.length);
				window.crypto.getRandomValues(rvBytes);
				for (i = 0; i < ba.length; ++i)
					ba[i] = sr.getByte() ^ rvBytes[i];
				return;
			} catch (e) {
				alert(e);
			}
		}
		for (i = 0; i < ba.length; ++i) ba[i] = sr.getByte();
	};


	// --- static methods ---

	// Mix in the current time (w/milliseconds) into the pool
	// NOTE: this method should be called from body click/keypress event handlers to increase entropy
	sr.seedTime = function () {
		sr.seedInt(new Date().getTime());
	}

	sr.getByte = function () {
		if (sr.state == null) {
			sr.seedTime();
			sr.state = sr.ArcFour(); // Plug in your RNG constructor here
			sr.state.init(sr.pool);
			sr.poolCopyOnInit = [];
			for (sr.pptr = 0; sr.pptr < sr.pool.length; ++sr.pptr)
				sr.poolCopyOnInit[sr.pptr] = sr.pool[sr.pptr];
			sr.pptr = 0;
		}
		// TODO: allow reseeding after first request
		return sr.state.next();
	}

	// Mix in a 32-bit integer into the pool
	sr.seedInt = function (x) {
		sr.seedInt8(x);
		sr.seedInt8((x >> 8));
		sr.seedInt8((x >> 16));
		sr.seedInt8((x >> 24));
	}

	// Mix in a 16-bit integer into the pool
	sr.seedInt16 = function (x) {
		sr.seedInt8(x);
		sr.seedInt8((x >> 8));
	}

	// Mix in a 8-bit integer into the pool
	sr.seedInt8 = function (x) {
		sr.pool[sr.pptr++] ^= x & 255;
		if (sr.pptr >= sr.poolSize) sr.pptr -= sr.poolSize;
	}

	// Arcfour is a PRNG
	sr.ArcFour = function () {
		function Arcfour() {
			this.i = 0;
			this.j = 0;
			this.S = new Array();
		}

		// Initialize arcfour context from key, an array of ints, each from [0..255]
		function ARC4init(key) {
			var i, j, t;
			for (i = 0; i < 256; ++i)
				this.S[i] = i;
			j = 0;
			for (i = 0; i < 256; ++i) {
				j = (j + this.S[i] + key[i % key.length]) & 255;
				t = this.S[i];
				this.S[i] = this.S[j];
				this.S[j] = t;
			}
			this.i = 0;
			this.j = 0;
		}

		function ARC4next() {
			var t;
			this.i = (this.i + 1) & 255;
			this.j = (this.j + this.S[this.i]) & 255;
			t = this.S[this.i];
			this.S[this.i] = this.S[this.j];
			this.S[this.j] = t;
			return this.S[(t + this.S[this.i]) & 255];
		}

		Arcfour.prototype.init = ARC4init;
		Arcfour.prototype.next = ARC4next;

		return new Arcfour();
	};


	// Initialize the pool with junk if needed.
	if (sr.pool == null) {
		sr.pool = new Array();
		sr.pptr = 0;
		var t;
		if (window.crypto && window.crypto.getRandomValues && window.Uint8Array) {
			try {
				// Use webcrypto if available
				var ua = new Uint8Array(sr.poolSize);
				window.crypto.getRandomValues(ua);
				for (t = 0; t < sr.poolSize; ++t)
					sr.pool[sr.pptr++] = ua[t];
			} catch (e) { alert(e); }
		}
		while (sr.pptr < sr.poolSize) {  // extract some randomness from Math.random()
			t = Math.floor(65536 * Math.random());
			sr.pool[sr.pptr++] = t >>> 8;
			sr.pool[sr.pptr++] = t & 255;
		}
		sr.pptr = Math.floor(sr.poolSize * Math.random());
		sr.seedTime();
		// entropy
		var entropyStr = "";
		// screen size and color depth: ~4.8 to ~5.4 bits
		entropyStr += (window.screen.height * window.screen.width * window.screen.colorDepth);
		entropyStr += (window.screen.availHeight * window.screen.availWidth * window.screen.pixelDepth);
		// time zone offset: ~4 bits
		var dateObj = new Date();
		var timeZoneOffset = dateObj.getTimezoneOffset();
		entropyStr += timeZoneOffset;
		// user agent: ~8.3 to ~11.6 bits
		entropyStr += navigator.userAgent;
		// browser plugin details: ~16.2 to ~21.8 bits
		var pluginsStr = "";
		for (var i = 0; i < navigator.plugins.length; i++) {
			pluginsStr += navigator.plugins[i].name + " " + navigator.plugins[i].filename + " " + navigator.plugins[i].description + " " + navigator.plugins[i].version + ", ";
		}
		var mimeTypesStr = "";
		for (var i = 0; i < navigator.mimeTypes.length; i++) {
			mimeTypesStr += navigator.mimeTypes[i].description + " " + navigator.mimeTypes[i].type + " " + navigator.mimeTypes[i].suffixes + ", ";
		}
		entropyStr += pluginsStr + mimeTypesStr;
		// cookies and storage: 1 bit
		entropyStr += navigator.cookieEnabled + typeof (sessionStorage) + typeof (localStorage);
		// language: ~7 bit
		entropyStr += navigator.language;
		// history: ~2 bit
		entropyStr += window.history.length;
		// location
		entropyStr += window.location;

		var entropyBytes = Crypto.SHA256(entropyStr, { asBytes: true });
		for (var i = 0 ; i < entropyBytes.length ; i++) {
			sr.seedInt8(entropyBytes[i]);
		}
	}
})();

(function () {

	// Constructor function of Global EllipticCurve object
	var ec = window.EllipticCurve = function () { };


	// ----------------
	// ECFieldElementFp constructor
	// q instanceof BigInteger
	// x instanceof BigInteger
	ec.FieldElementFp = function (q, x) {
		this.x = x;
		// TODO if(x.compareTo(q) >= 0) error
		this.q = q;
	};

	ec.FieldElementFp.prototype.equals = function (other) {
		if (other == this) return true;
		return (this.q.equals(other.q) && this.x.equals(other.x));
	};

	ec.FieldElementFp.prototype.toBigInteger = function () {
		return this.x;
	};

	ec.FieldElementFp.prototype.negate = function () {
		return new ec.FieldElementFp(this.q, this.x.negate().mod(this.q));
	};

	ec.FieldElementFp.prototype.add = function (b) {
		return new ec.FieldElementFp(this.q, this.x.add(b.toBigInteger()).mod(this.q));
	};

	ec.FieldElementFp.prototype.subtract = function (b) {
		return new ec.FieldElementFp(this.q, this.x.subtract(b.toBigInteger()).mod(this.q));
	};

	ec.FieldElementFp.prototype.multiply = function (b) {
		return new ec.FieldElementFp(this.q, this.x.multiply(b.toBigInteger()).mod(this.q));
	};

	ec.FieldElementFp.prototype.square = function () {
		return new ec.FieldElementFp(this.q, this.x.square().mod(this.q));
	};

	ec.FieldElementFp.prototype.divide = function (b) {
		return new ec.FieldElementFp(this.q, this.x.multiply(b.toBigInteger().modInverse(this.q)).mod(this.q));
	};

	ec.FieldElementFp.prototype.getByteLength = function () {
		return Math.floor((this.toBigInteger().bitLength() + 7) / 8);
	};

	// D.1.4 91
	/**
	* return a sqrt root - the routine verifies that the calculation
	* returns the right value - if none exists it returns null.
	*/
	ec.FieldElementFp.prototype.sqrt = function () {
		if (!this.q.testBit(0)) throw new Error("even value of q");

		// p mod 4 == 3
		if (this.q.testBit(1)) {
			// z = g^(u+1) + p, p = 4u + 3
			var z = new ec.FieldElementFp(this.q, this.x.modPow(this.q.shiftRight(2).add(BigInteger.ONE), this.q));
			return z.square().equals(this) ? z : null;
		}

		// p mod 4 == 1
		var qMinusOne = this.q.subtract(BigInteger.ONE);
		var legendreExponent = qMinusOne.shiftRight(1);
		if (!(this.x.modPow(legendreExponent, this.q).equals(BigInteger.ONE))) return null;
		var u = qMinusOne.shiftRight(2);
		var k = u.shiftLeft(1).add(BigInteger.ONE);
		var Q = this.x;
		var fourQ = Q.shiftLeft(2).mod(this.q);
		var U, V;

		do {
			var rand = new SecureRandom();
			var P;
			do {
				P = new BigInteger(this.q.bitLength(), rand);
			}
			while (P.compareTo(this.q) >= 0 || !(P.multiply(P).subtract(fourQ).modPow(legendreExponent, this.q).equals(qMinusOne)));

			var result = ec.FieldElementFp.fastLucasSequence(this.q, P, Q, k);

			U = result[0];
			V = result[1];
			if (V.multiply(V).mod(this.q).equals(fourQ)) {
				// Integer division by 2, mod q
				if (V.testBit(0)) {
					V = V.add(this.q);
				}
				V = V.shiftRight(1);
				return new ec.FieldElementFp(this.q, V);
			}
		}
		while (U.equals(BigInteger.ONE) || U.equals(qMinusOne));

		return null;
	};

	ec.FieldElementFp.fastLucasSequence = function (p, P, Q, k) {
		// TODO Research and apply "common-multiplicand multiplication here"

		var n = k.bitLength();
		var s = k.getLowestSetBit();
		var Uh = BigInteger.ONE;
		var Vl = BigInteger.TWO;
		var Vh = P;
		var Ql = BigInteger.ONE;
		var Qh = BigInteger.ONE;

		for (var j = n - 1; j >= s + 1; --j) {
			Ql = Ql.multiply(Qh).mod(p);
			if (k.testBit(j)) {
				Qh = Ql.multiply(Q).mod(p);
				Uh = Uh.multiply(Vh).mod(p);
				Vl = Vh.multiply(Vl).subtract(P.multiply(Ql)).mod(p);
				Vh = Vh.multiply(Vh).subtract(Qh.shiftLeft(1)).mod(p);
			}
			else {
				Qh = Ql;
				Uh = Uh.multiply(Vl).subtract(Ql).mod(p);
				Vh = Vh.multiply(Vl).subtract(P.multiply(Ql)).mod(p);
				Vl = Vl.multiply(Vl).subtract(Ql.shiftLeft(1)).mod(p);
			}
		}

		Ql = Ql.multiply(Qh).mod(p);
		Qh = Ql.multiply(Q).mod(p);
		Uh = Uh.multiply(Vl).subtract(Ql).mod(p);
		Vl = Vh.multiply(Vl).subtract(P.multiply(Ql)).mod(p);
		Ql = Ql.multiply(Qh).mod(p);

		for (var j = 1; j <= s; ++j) {
			Uh = Uh.multiply(Vl).mod(p);
			Vl = Vl.multiply(Vl).subtract(Ql.shiftLeft(1)).mod(p);
			Ql = Ql.multiply(Ql).mod(p);
		}

		return [Uh, Vl];
	};

	// ----------------
	// ECPointFp constructor
	ec.PointFp = function (curve, x, y, z, compressed) {
		this.curve = curve;
		this.x = x;
		this.y = y;
		// Projective coordinates: either zinv == null or z * zinv == 1
		// z and zinv are just BigIntegers, not fieldElements
		if (z == null) {
			this.z = BigInteger.ONE;
		}
		else {
			this.z = z;
		}
		this.zinv = null;
		// compression flag
		this.compressed = !!compressed;
	};

	ec.PointFp.prototype.getX = function () {
		if (this.zinv == null) {
			this.zinv = this.z.modInverse(this.curve.q);
		}
		var r = this.x.toBigInteger().multiply(this.zinv);
		this.curve.reduce(r);
		return this.curve.fromBigInteger(r);
	};

	ec.PointFp.prototype.getY = function () {
		if (this.zinv == null) {
			this.zinv = this.z.modInverse(this.curve.q);
		}
		var r = this.y.toBigInteger().multiply(this.zinv);
		this.curve.reduce(r);
		return this.curve.fromBigInteger(r);
	};

	ec.PointFp.prototype.equals = function (other) {
		if (other == this) return true;
		if (this.isInfinity()) return other.isInfinity();
		if (other.isInfinity()) return this.isInfinity();
		var u, v;
		// u = Y2 * Z1 - Y1 * Z2
		u = other.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(other.z)).mod(this.curve.q);
		if (!u.equals(BigInteger.ZERO)) return false;
		// v = X2 * Z1 - X1 * Z2
		v = other.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(other.z)).mod(this.curve.q);
		return v.equals(BigInteger.ZERO);
	};

	ec.PointFp.prototype.isInfinity = function () {
		if ((this.x == null) && (this.y == null)) return true;
		return this.z.equals(BigInteger.ZERO) && !this.y.toBigInteger().equals(BigInteger.ZERO);
	};

	ec.PointFp.prototype.negate = function () {
		return new ec.PointFp(this.curve, this.x, this.y.negate(), this.z);
	};

	ec.PointFp.prototype.add = function (b) {
		if (this.isInfinity()) return b;
		if (b.isInfinity()) return this;

		// u = Y2 * Z1 - Y1 * Z2
		var u = b.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(b.z)).mod(this.curve.q);
		// v = X2 * Z1 - X1 * Z2
		var v = b.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(b.z)).mod(this.curve.q);


		if (BigInteger.ZERO.equals(v)) {
			if (BigInteger.ZERO.equals(u)) {
				return this.twice(); // this == b, so double
			}
			return this.curve.getInfinity(); // this = -b, so infinity
		}

		var THREE = new BigInteger("3");
		var x1 = this.x.toBigInteger();
		var y1 = this.y.toBigInteger();
		var x2 = b.x.toBigInteger();
		var y2 = b.y.toBigInteger();

		var v2 = v.square();
		var v3 = v2.multiply(v);
		var x1v2 = x1.multiply(v2);
		var zu2 = u.square().multiply(this.z);

		// x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
		var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.q);
		// y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
		var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.q);
		// z3 = v^3 * z1 * z2
		var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.q);

		return new ec.PointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
	};

	ec.PointFp.prototype.twice = function () {
		if (this.isInfinity()) return this;
		if (this.y.toBigInteger().signum() == 0) return this.curve.getInfinity();

		// TODO: optimized handling of constants
		var THREE = new BigInteger("3");
		var x1 = this.x.toBigInteger();
		var y1 = this.y.toBigInteger();

		var y1z1 = y1.multiply(this.z);
		var y1sqz1 = y1z1.multiply(y1).mod(this.curve.q);
		var a = this.curve.a.toBigInteger();

		// w = 3 * x1^2 + a * z1^2
		var w = x1.square().multiply(THREE);
		if (!BigInteger.ZERO.equals(a)) {
			w = w.add(this.z.square().multiply(a));
		}
		w = w.mod(this.curve.q);
		//this.curve.reduce(w);
		// x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
		var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.q);
		// y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
		var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.square().multiply(w)).mod(this.curve.q);
		// z3 = 8 * (y1 * z1)^3
		var z3 = y1z1.square().multiply(y1z1).shiftLeft(3).mod(this.curve.q);

		return new ec.PointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
	};

	// Simple NAF (Non-Adjacent Form) multiplication algorithm
	// TODO: modularize the multiplication algorithm
	ec.PointFp.prototype.multiply = function (k) {
		if (this.isInfinity()) return this;
		if (k.signum() == 0) return this.curve.getInfinity();

		var e = k;
		var h = e.multiply(new BigInteger("3"));

		var neg = this.negate();
		var R = this;

		var i;
		for (i = h.bitLength() - 2; i > 0; --i) {
			R = R.twice();

			var hBit = h.testBit(i);
			var eBit = e.testBit(i);

			if (hBit != eBit) {
				R = R.add(hBit ? this : neg);
			}
		}

		return R;
	};

	// Compute this*j + x*k (simultaneous multiplication)
	ec.PointFp.prototype.multiplyTwo = function (j, x, k) {
		var i;
		if (j.bitLength() > k.bitLength())
			i = j.bitLength() - 1;
		else
			i = k.bitLength() - 1;

		var R = this.curve.getInfinity();
		var both = this.add(x);
		while (i >= 0) {
			R = R.twice();
			if (j.testBit(i)) {
				if (k.testBit(i)) {
					R = R.add(both);
				}
				else {
					R = R.add(this);
				}
			}
			else {
				if (k.testBit(i)) {
					R = R.add(x);
				}
			}
			--i;
		}

		return R;
	};

	ec.PointFp.prototype.getEncoded = function (compressed) {
		var x = this.getX().toBigInteger();
		var y = this.getY().toBigInteger();
		var len = 32; // integerToBytes will zero pad if integer is less than 32 bytes. 32 bytes length is required by the Bitcoin protocol.
		var enc = ec.integerToBytes(x, len);

		// when compressed prepend byte depending if y point is even or odd
		if (compressed) {
			if (y.isEven()) {
				enc.unshift(0x02);
			}
			else {
				enc.unshift(0x03);
			}
		}
		else {
			enc.unshift(0x04);
			enc = enc.concat(ec.integerToBytes(y, len)); // uncompressed public key appends the bytes of the y point
		}
		return enc;
	};

	ec.PointFp.decodeFrom = function (curve, enc) {
		var type = enc[0];
		var dataLen = enc.length - 1;

		// Extract x and y as byte arrays
		var xBa = enc.slice(1, 1 + dataLen / 2);
		var yBa = enc.slice(1 + dataLen / 2, 1 + dataLen);

		// Prepend zero byte to prevent interpretation as negative integer
		xBa.unshift(0);
		yBa.unshift(0);

		// Convert to BigIntegers
		var x = new BigInteger(xBa);
		var y = new BigInteger(yBa);

		// Return point
		return new ec.PointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
	};

	ec.PointFp.prototype.add2D = function (b) {
		if (this.isInfinity()) return b;
		if (b.isInfinity()) return this;

		if (this.x.equals(b.x)) {
			if (this.y.equals(b.y)) {
				// this = b, i.e. this must be doubled
				return this.twice();
			}
			// this = -b, i.e. the result is the point at infinity
			return this.curve.getInfinity();
		}

		var x_x = b.x.subtract(this.x);
		var y_y = b.y.subtract(this.y);
		var gamma = y_y.divide(x_x);

		var x3 = gamma.square().subtract(this.x).subtract(b.x);
		var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

		return new ec.PointFp(this.curve, x3, y3);
	};

	ec.PointFp.prototype.twice2D = function () {
		if (this.isInfinity()) return this;
		if (this.y.toBigInteger().signum() == 0) {
			// if y1 == 0, then (x1, y1) == (x1, -y1)
			// and hence this = -this and thus 2(x1, y1) == infinity
			return this.curve.getInfinity();
		}

		var TWO = this.curve.fromBigInteger(BigInteger.valueOf(2));
		var THREE = this.curve.fromBigInteger(BigInteger.valueOf(3));
		var gamma = this.x.square().multiply(THREE).add(this.curve.a).divide(this.y.multiply(TWO));

		var x3 = gamma.square().subtract(this.x.multiply(TWO));
		var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

		return new ec.PointFp(this.curve, x3, y3);
	};

	ec.PointFp.prototype.multiply2D = function (k) {
		if (this.isInfinity()) return this;
		if (k.signum() == 0) return this.curve.getInfinity();

		var e = k;
		var h = e.multiply(new BigInteger("3"));

		var neg = this.negate();
		var R = this;

		var i;
		for (i = h.bitLength() - 2; i > 0; --i) {
			R = R.twice();

			var hBit = h.testBit(i);
			var eBit = e.testBit(i);

			if (hBit != eBit) {
				R = R.add2D(hBit ? this : neg);
			}
		}

		return R;
	};

	ec.PointFp.prototype.isOnCurve = function () {
		var x = this.getX().toBigInteger();
		var y = this.getY().toBigInteger();
		var a = this.curve.getA().toBigInteger();
		var b = this.curve.getB().toBigInteger();
		var n = this.curve.getQ();
		var lhs = y.multiply(y).mod(n);
		var rhs = x.multiply(x).multiply(x).add(a.multiply(x)).add(b).mod(n);
		return lhs.equals(rhs);
	};

	ec.PointFp.prototype.toString = function () {
		return '(' + this.getX().toBigInteger().toString() + ',' + this.getY().toBigInteger().toString() + ')';
	};

	/**
	* Validate an elliptic curve point.
	*
	* See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
	*/
	ec.PointFp.prototype.validate = function () {
		var n = this.curve.getQ();

		// Check Q != O
		if (this.isInfinity()) {
			throw new Error("Point is at infinity.");
		}

		// Check coordinate bounds
		var x = this.getX().toBigInteger();
		var y = this.getY().toBigInteger();
		if (x.compareTo(BigInteger.ONE) < 0 || x.compareTo(n.subtract(BigInteger.ONE)) > 0) {
			throw new Error('x coordinate out of bounds');
		}
		if (y.compareTo(BigInteger.ONE) < 0 || y.compareTo(n.subtract(BigInteger.ONE)) > 0) {
			throw new Error('y coordinate out of bounds');
		}

		// Check y^2 = x^3 + ax + b (mod n)
		if (!this.isOnCurve()) {
			throw new Error("Point is not on the curve.");
		}

		// Check nQ = 0 (Q is a scalar multiple of G)
		if (this.multiply(n).isInfinity()) {
			// TODO: This check doesn't work - fix.
			throw new Error("Point is not a scalar multiple of G.");
		}

		return true;
	};

	// ----------------
	// ECCurveFp constructor
	ec.CurveFp = function (q, a, b) {
		this.q = q;
		this.a = this.fromBigInteger(a);
		this.b = this.fromBigInteger(b);
		this.infinity = new ec.PointFp(this, null, null);
		this.reducer = new Barrett(this.q);
	}

	ec.CurveFp.prototype.getQ = function () {
		return this.q;
	};

	ec.CurveFp.prototype.getA = function () {
		return this.a;
	};

	ec.CurveFp.prototype.getB = function () {
		return this.b;
	};

	ec.CurveFp.prototype.equals = function (other) {
		if (other == this) return true;
		return (this.q.equals(other.q) && this.a.equals(other.a) && this.b.equals(other.b));
	};

	ec.CurveFp.prototype.getInfinity = function () {
		return this.infinity;
	};

	ec.CurveFp.prototype.fromBigInteger = function (x) {
		return new ec.FieldElementFp(this.q, x);
	};

	ec.CurveFp.prototype.reduce = function (x) {
		this.reducer.reduce(x);
	};

	// for now, work with hex strings because they're easier in JS
	// compressed support added by bitaddress.org
	ec.CurveFp.prototype.decodePointHex = function (s) {
		var firstByte = parseInt(s.substr(0, 2), 16);
		switch (firstByte) { // first byte
			case 0:
				return this.infinity;
			case 2: // compressed
			case 3: // compressed
				var yTilde = firstByte & 1;
				var xHex = s.substr(2, s.length - 2);
				var X1 = new BigInteger(xHex, 16);
				return this.decompressPoint(yTilde, X1);
			case 4: // uncompressed
			case 6: // hybrid
			case 7: // hybrid
				var len = (s.length - 2) / 2;
				var xHex = s.substr(2, len);
				var yHex = s.substr(len + 2, len);

				return new ec.PointFp(this,
					this.fromBigInteger(new BigInteger(xHex, 16)),
					this.fromBigInteger(new BigInteger(yHex, 16)));

			default: // unsupported
				return null;
		}
	};

	ec.CurveFp.prototype.encodePointHex = function (p) {
		if (p.isInfinity()) return "00";
		var xHex = p.getX().toBigInteger().toString(16);
		var yHex = p.getY().toBigInteger().toString(16);
		var oLen = this.getQ().toString(16).length;
		if ((oLen % 2) != 0) oLen++;
		while (xHex.length < oLen) {
			xHex = "0" + xHex;
		}
		while (yHex.length < oLen) {
			yHex = "0" + yHex;
		}
		return "04" + xHex + yHex;
	};

	ec.CurveFp.prototype.decompressPoint = function (yTilde, X1) {
		var x = this.fromBigInteger(X1);
		var alpha = x.multiply(x.square().add(this.getA())).add(this.getB());
		var beta = alpha.sqrt();
		// if we can't find a sqrt we haven't got a point on the curve - run!
		if (beta == null) throw new Error("Invalid point compression");
		var betaValue = beta.toBigInteger();
		var bit0 = betaValue.testBit(0) ? 1 : 0;
		if (bit0 != yTilde) {
			// Use the other root
			beta = this.fromBigInteger(this.getQ().subtract(betaValue));
		}
		return new ec.PointFp(this, x, beta, null, true);
	};


	ec.fromHex = function (s) { return new BigInteger(s, 16); };

	ec.integerToBytes = function (i, len) {
		var bytes = i.toByteArrayUnsigned();
		if (len < bytes.length) {
			bytes = bytes.slice(bytes.length - len);
		} else while (len > bytes.length) {
			bytes.unshift(0);
		}
		return bytes;
	};


	// Named EC curves
	// ----------------
	// X9ECParameters constructor
	ec.X9Parameters = function (curve, g, n, h) {
		this.curve = curve;
		this.g = g;
		this.n = n;
		this.h = h;
	}
	ec.X9Parameters.prototype.getCurve = function () { return this.curve; };
	ec.X9Parameters.prototype.getG = function () { return this.g; };
	ec.X9Parameters.prototype.getN = function () { return this.n; };
	ec.X9Parameters.prototype.getH = function () { return this.h; };

	// secp256k1 is the Curve used by Bitcoin
	ec.secNamedCurves = {
		// used by Bitcoin
		"secp256k1": function () {
			// p = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1
			var p = ec.fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
			var a = BigInteger.ZERO;
			var b = ec.fromHex("7");
			var n = ec.fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
			var h = BigInteger.ONE;
			var curve = new ec.CurveFp(p, a, b);
			var G = curve.decodePointHex("04"
					+ "79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"
					+ "483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8");
			return new ec.X9Parameters(curve, G, n, h);
		}
	};

	// secp256k1 called by Bitcoin's ECKEY
	ec.getSECCurveByName = function (name) {
		if (ec.secNamedCurves[name] == undefined) return null;
		return ec.secNamedCurves[name]();
	}
})();

(function(exports, global){
var defaults = {
	bits: 8, // default number of bits
	radix: 16, // work with HEX by default
	minBits: 3,
	maxBits: 20, // this permits 1,048,575 shares, though going this high is NOT recommended in JS!

	bytesPerChar: 2,
	maxBytesPerChar: 6, // Math.pow(256,7) > Math.pow(2,53)

	// Primitive polynomials (in decimal form) for Galois Fields GF(2^n), for 2 <= n <= 30
	// The index of each term in the array corresponds to the n for that polynomial
	// i.e. to get the polynomial for n=16, use primitivePolynomials[16]
	primitivePolynomials: [null,null,1,3,3,5,3,3,29,17,9,5,83,27,43,3,45,9,39,39,9,5,3,33,27,9,71,39,9,5,83],

	// warning for insecure PRNG
	warning: 'WARNING:\nA secure random number generator was not found.\nUsing Math.random(), which is NOT cryptographically strong!'
};

// Protected settings object
var config = {};

/** @expose **/
exports.getConfig = function(){
	return {
		'bits': config.bits,
		'unsafePRNG': config.unsafePRNG
	};
};

function init(bits){
	if(bits && (typeof bits !== 'number' || bits%1 !== 0 || bits<defaults.minBits || bits>defaults.maxBits)){
		throw new Error('Number of bits must be an integer between ' + defaults.minBits + ' and ' + defaults.maxBits + ', inclusive.')
	}

	config.radix = defaults.radix;
	config.bits = bits || defaults.bits;
	config.size = Math.pow(2, config.bits);
	config.max = config.size - 1;

	// Construct the exp and log tables for multiplication.
	var logs = [], exps = [], x = 1, primitive = defaults.primitivePolynomials[config.bits];
	for(var i=0; i<config.size; i++){
		exps[i] = x;
		logs[x] = i;
		x <<= 1;
		if(x >= config.size){
			x ^= primitive;
			x &= config.max;
		}
	}

	config.logs = logs;
	config.exps = exps;
};

/** @expose **/
exports.init = init;

function isInited(){
	if(!config.bits || !config.size || !config.max  || !config.logs || !config.exps || config.logs.length !== config.size || config.exps.length !== config.size){
		return false;
	}
	return true;
};

// Returns a pseudo-random number generator of the form function(bits){}
// which should output a random string of 1's and 0's of length `bits`
function getRNG(){
	var randomBits, crypto;

	function construct(bits, arr, radix, size){
		var str = '',
			i = 0,
			len = arr.length-1;
		while( i<len || (str.length < bits) ){
			str += padLeft(parseInt(arr[i], radix).toString(2), size);
			i++;
		}
		str = str.substr(-bits);
		if( (str.match(/0/g)||[]).length === str.length){ // all zeros?
			return null;
		}else{
			return str;
		}
	}

	// node.js crypto.randomBytes()
	if(typeof require === 'function' && (crypto=require('crypto')) && (randomBits=crypto['randomBytes'])){
		return function(bits){
			var bytes = Math.ceil(bits/8),
				str = null;

			while( str === null ){
				str = construct(bits, randomBits(bytes).toString('hex'), 16, 4);
			}
			return str;
		}
	}

	// browsers with window.crypto.getRandomValues()
	if(global['crypto'] && typeof global['crypto']['getRandomValues'] === 'function' && typeof global['Uint32Array'] === 'function'){
		crypto = global['crypto'];
		return function(bits){
			var elems = Math.ceil(bits/32),
				str = null,
				arr = new global['Uint32Array'](elems);

			while( str === null ){
				crypto['getRandomValues'](arr);
				str = construct(bits, arr, 10, 32);
			}

			return str;
		}
	}

	// A totally insecure RNG!!! (except in Safari)
	// Will produce a warning every time it is called.
	config.unsafePRNG = true;
	warn();

	var bitsPerNum = 32;
	var max = Math.pow(2,bitsPerNum)-1;
	return function(bits){
		var elems = Math.ceil(bits/bitsPerNum);
		var arr = [], str=null;
		while(str===null){
			for(var i=0; i<elems; i++){
				arr[i] = Math.floor(Math.random() * max + 1);
			}
			str = construct(bits, arr, 10, bitsPerNum);
		}
		return str;
	};
};

// Warn about using insecure rng.
// Called when Math.random() is being used.
function warn(){
	global['console']['warn'](defaults.warning);
	if(typeof global['alert'] === 'function' && config.alert){
		global['alert'](defaults.warning);
	}
}

// Set the PRNG to use. If no RNG function is supplied, pick a default using getRNG()
/** @expose **/
exports.setRNG = function(rng, alert){
	if(!isInited()){
		this.init();
	}
	config.unsafePRNG=false;
	rng = rng || getRNG();

	// test the RNG (5 times)
	if(typeof rng !== 'function' || typeof rng(config.bits) !== 'string' || !parseInt(rng(config.bits),2) || rng(config.bits).length > config.bits || rng(config.bits).length < config.bits){
		throw new Error("Random number generator is invalid. Supply an RNG of the form function(bits){} that returns a string containing 'bits' number of random 1's and 0's.")
	}else{
		config.rng = rng;
	}
	config.alert = !!alert;

	return !!config.unsafePRNG;
};

function isSetRNG(){
	return typeof config.rng === 'function';
};

// Generates a random bits-length number string using the PRNG
/** @expose **/
exports.random = function(bits){
	if(!isSetRNG()){
		this.setRNG();
	}

	if(typeof bits !== 'number' || bits%1 !== 0 || bits < 2){
		throw new Error('Number of bits must be an integer greater than 1.')
	}

	if(config.unsafePRNG){
		warn();
	}
	return bin2hex(config.rng(bits));
}

// Divides a `secret` number String str expressed in radix `inputRadix` (optional, default 16)
// into `numShares` shares, each expressed in radix `outputRadix` (optional, default to `inputRadix`),
// requiring `threshold` number of shares to reconstruct the secret.
// Optionally, zero-pads the secret to a length that is a multiple of padLength before sharing.
/** @expose **/
exports.share = function(secret, numShares, threshold, padLength, withoutPrefix){
	if(!isInited()){
		this.init();
	}
	if(!isSetRNG()){
		this.setRNG();
	}

	padLength =  padLength || 0;

	if(typeof secret !== 'string'){
		throw new Error('Secret must be a string.');
	}
	if(typeof numShares !== 'number' || numShares%1 !== 0 || numShares < 2){
		throw new Error('Number of shares must be an integer between 2 and 2^bits-1 (' + config.max + '), inclusive.')
	}
	if(numShares > config.max){
		var neededBits = Math.ceil(Math.log(numShares +1)/Math.LN2);
		throw new Error('Number of shares must be an integer between 2 and 2^bits-1 (' + config.max + '), inclusive. To create ' + numShares + ' shares, use at least ' + neededBits + ' bits.')
	}
	if(typeof threshold !== 'number' || threshold%1 !== 0 || threshold < 2){
		throw new Error('Threshold number of shares must be an integer between 2 and 2^bits-1 (' + config.max + '), inclusive.');
	}
	if(threshold > config.max){
		var neededBits = Math.ceil(Math.log(threshold +1)/Math.LN2);
		throw new Error('Threshold number of shares must be an integer between 2 and 2^bits-1 (' + config.max + '), inclusive.  To use a threshold of ' + threshold + ', use at least ' + neededBits + ' bits.');
	}
	if(typeof padLength !== 'number' || padLength%1 !== 0 ){
		throw new Error('Zero-pad length must be an integer greater than 1.');
	}

	if(config.unsafePRNG){
		warn();
	}

	secret = '1' + hex2bin(secret); // append a 1 so that we can preserve the correct number of leading zeros in our secret
	secret = split(secret, padLength);
	var x = new Array(numShares), y = new Array(numShares);
	for(var i=0, len = secret.length; i<len; i++){
		var subShares = this._getShares(secret[i], numShares, threshold);
		for(var j=0; j<numShares; j++){
			x[j] = x[j] || subShares[j].x.toString(config.radix);
			y[j] = padLeft(subShares[j].y.toString(2)) + (y[j] ? y[j] : '');
		}
	}
	var padding = config.max.toString(config.radix).length;
	if(withoutPrefix){
		for(var i=0; i<numShares; i++){
			x[i] = bin2hex(y[i]);
		}
	}else{
		for(var i=0; i<numShares; i++){
			x[i] = config.bits.toString(36).toUpperCase() + padLeft(x[i],padding) + bin2hex(y[i]);
		}
	}

	return x;
};

// This is the basic polynomial generation and evaluation function
// for a `config.bits`-length secret (NOT an arbitrary length)
// Note: no error-checking at this stage! If `secrets` is NOT
// a NUMBER less than 2^bits-1, the output will be incorrect!
/** @expose **/
exports._getShares = function(secret, numShares, threshold){
	var shares = [];
	var coeffs = [secret];

	for(var i=1; i<threshold; i++){
		coeffs[i] = parseInt(config.rng(config.bits),2);
	}
	for(var i=1, len = numShares+1; i<len; i++){
		shares[i-1] = {
			x: i,
			y: horner(i, coeffs)
		}
	}
	return shares;
};

// Polynomial evaluation at `x` using Horner's Method
// TODO: this can possibly be sped up using other methods
// NOTE: fx=fx * x + coeff[i] ->  exp(log(fx) + log(x)) + coeff[i],
//       so if fx===0, just set fx to coeff[i] because
//       using the exp/log form will result in incorrect value
function horner(x, coeffs){
	var logx = config.logs[x];
	var fx = 0;
	for(var i=coeffs.length-1; i>=0; i--){
		if(fx === 0){
			fx = coeffs[i];
			continue;
		}
		fx = config.exps[ (logx + config.logs[fx]) % config.max ] ^ coeffs[i];
	}
	return fx;
};

function inArray(arr,val){
	for(var i = 0,len=arr.length; i < len; i++) {
		if(arr[i] === val){
   		 return true;
	 	}
 	}
	return false;
};

function processShare(share){

	var bits = parseInt(share[0], 36);
	if(bits && (typeof bits !== 'number' || bits%1 !== 0 || bits<defaults.minBits || bits>defaults.maxBits)){
		throw new Error('Number of bits must be an integer between ' + defaults.minBits + ' and ' + defaults.maxBits + ', inclusive.')
	}

	var max = Math.pow(2, bits) - 1;
	var idLength = max.toString(config.radix).length;

	var id = parseInt(share.substr(1, idLength), config.radix);
	if(typeof id !== 'number' || id%1 !== 0 || id<1 || id>max){
		throw new Error('Share id must be an integer between 1 and ' + config.max + ', inclusive.');
	}
	share = share.substr(idLength + 1);
	if(!share.length){
		throw new Error('Invalid share: zero-length share.')
	}
	return {
		'bits': bits,
		'id': id,
		'value': share
	};
};

/** @expose **/
exports._processShare = processShare;

// Protected method that evaluates the Lagrange interpolation
// polynomial at x=`at` for individual config.bits-length
// segments of each share in the `shares` Array.
// Each share is expressed in base `inputRadix`. The output
// is expressed in base `outputRadix'
function combine(at, shares){
	var setBits, share, x = [], y = [], result = '', idx;

	for(var i=0, len = shares.length; i<len; i++){
		share = processShare(shares[i]);
		if(typeof setBits === 'undefined'){
			setBits = share['bits'];
		}else if(share['bits'] !== setBits){
			throw new Error('Mismatched shares: Different bit settings.')
		}

		if(config.bits !== setBits){
			init(setBits);
		}

		if(inArray(x, share['id'])){ // repeated x value?
			continue;
		}

		idx = x.push(share['id']) - 1;
		share = split(hex2bin(share['value']));
		for(var j=0, len2 = share.length; j<len2; j++){
			y[j] = y[j] || [];
			y[j][idx] = share[j];
		}
	}

	for(var i=0, len=y.length; i<len; i++){
		result = padLeft(lagrange(at, x, y[i]).toString(2)) + result;
	}

	if(at===0){// reconstructing the secret
		var idx = result.indexOf('1'); //find the first 1
		return bin2hex(result.slice(idx+1));
	}else{// generating a new share
		return bin2hex(result);
	}
};

// Combine `shares` Array into the original secret
/** @expose **/
exports.combine = function(shares){
	return combine(0, shares);
};

// Generate a new share with id `id` (a number between 1 and 2^bits-1)
// `id` can be a Number or a String in the default radix (16)
/** @expose **/
exports.newShare = function(id, shares){
	if(typeof id === 'string'){
		id = parseInt(id, config.radix);
	}

	var share = processShare(shares[0]);
	var max = Math.pow(2, share['bits']) - 1;

	if(typeof id !== 'number' || id%1 !== 0 || id<1 || id>max){
		throw new Error('Share id must be an integer between 1 and ' + config.max + ', inclusive.');
	}

	var padding = max.toString(config.radix).length;
	return config.bits.toString(36).toUpperCase() + padLeft(id.toString(config.radix), padding) + combine(id, shares);
};

// Evaluate the Lagrange interpolation polynomial at x = `at`
// using x and y Arrays that are of the same length, with
// corresponding elements constituting points on the polynomial.
function lagrange(at, x, y){
	var sum = 0,
		product,
		i, j;

	for(var i=0, len = x.length; i<len; i++){
		if(!y[i]){
			continue;
		}

		product = config.logs[y[i]];
		for(var j=0; j<len; j++){
			if(i === j){ continue; }
			if(at === x[j]){ // happens when computing a share that is in the list of shares used to compute it
				product = -1; // fix for a zero product term, after which the sum should be sum^0 = sum, not sum^1
				break;
			}
			product = ( product + config.logs[at ^ x[j]] - config.logs[x[i] ^ x[j]] + config.max/* to make sure it's not negative */ ) % config.max;
		}

		sum = product === -1 ? sum : sum ^ config.exps[product]; // though exps[-1]= undefined and undefined ^ anything = anything in chrome, this behavior may not hold everywhere, so do the check
	}
	return sum;
};

/** @expose **/
exports._lagrange = lagrange;

// Splits a number string `bits`-length segments, after first
// optionally zero-padding it to a length that is a multiple of `padLength.
// Returns array of integers (each less than 2^bits-1), with each element
// representing a `bits`-length segment of the input string from right to left,
// i.e. parts[0] represents the right-most `bits`-length segment of the input string.
function split(str, padLength){
	if(padLength){
		str = padLeft(str, padLength)
	}
	var parts = [];
	for(var i=str.length; i>config.bits; i-=config.bits){
		parts.push(parseInt(str.slice(i-config.bits, i), 2));
	}
	parts.push(parseInt(str.slice(0, i), 2));
	return parts;
};

// Pads a string `str` with zeros on the left so that its length is a multiple of `bits`
function padLeft(str, bits){
	bits = bits || config.bits
	var missing = str.length % bits;
	return (missing ? new Array(bits - missing + 1).join('0') : '') + str;
};

function hex2bin(str){
	var bin = '', num;
	for(var i=str.length - 1; i>=0; i--){
		num = parseInt(str[i], 16)
		if(isNaN(num)){
			throw new Error('Invalid hex character.')
		}
		bin = padLeft(num.toString(2), 4) + bin;
	}
	return bin;
}

function bin2hex(str){
	var hex = '', num;
	str = padLeft(str, 4);
	for(var i=str.length; i>=4; i-=4){
		num = parseInt(str.slice(i-4, i), 2);
		if(isNaN(num)){
			throw new Error('Invalid binary character.')
		}
		hex = num.toString(16) + hex;
	}
	return hex;
}

// Converts a given UTF16 character string to the HEX representation.
// Each character of the input string is represented by
// `bytesPerChar` bytes in the output string.
/** @expose **/
exports.str2hex = function(str, bytesPerChar){
	if(typeof str !== 'string'){
		throw new Error('Input must be a character string.');
	}
	bytesPerChar = bytesPerChar || defaults.bytesPerChar;

	if(typeof bytesPerChar !== 'number' || bytesPerChar%1 !== 0 || bytesPerChar<1 || bytesPerChar > defaults.maxBytesPerChar){
		throw new Error('Bytes per character must be an integer between 1 and ' + defaults.maxBytesPerChar + ', inclusive.')
	}

	var hexChars = 2*bytesPerChar;
	var max = Math.pow(16, hexChars) - 1;
	var out = '', num;
	for(var i=0, len=str.length; i<len; i++){
		num = str[i].charCodeAt();
		if(isNaN(num)){
			throw new Error('Invalid character: ' + str[i]);
		}else if(num > max){
			var neededBytes = Math.ceil(Math.log(num+1)/Math.log(256));
			throw new Error('Invalid character code (' + num +'). Maximum allowable is 256^bytes-1 (' + max + '). To convert this character, use at least ' + neededBytes + ' bytes.')
		}else{
			out = padLeft(num.toString(16), hexChars) + out;
		}
	}
	return out;
};

// Converts a given HEX number string to a UTF16 character string.
/** @expose **/
exports.hex2str = function(str, bytesPerChar){
	if(typeof str !== 'string'){
		throw new Error('Input must be a hexadecimal string.');
	}
	bytesPerChar = bytesPerChar || defaults.bytesPerChar;

	if(typeof bytesPerChar !== 'number' || bytesPerChar%1 !== 0 || bytesPerChar<1 || bytesPerChar > defaults.maxBytesPerChar){
		throw new Error('Bytes per character must be an integer between 1 and ' + defaults.maxBytesPerChar + ', inclusive.')
	}

	var hexChars = 2*bytesPerChar;
	var out = '';
	str = padLeft(str, hexChars);
	for(var i=0, len = str.length; i<len; i+=hexChars){
		out = String.fromCharCode(parseInt(str.slice(i, i+hexChars),16)) + out;
	}
	return out;
};

// by default, initialize without an RNG
exports.init();
})(typeof module !== 'undefined' && module['exports'] ? module['exports'] : (window['secrets'] = {}), typeof GLOBAL !== 'undefined' ? GLOBAL : window );

(function () {

	// (public) Constructor function of Global BigInteger object
	var BigInteger = window.BigInteger = function BigInteger(a, b, c) {
		if (!(this instanceof BigInteger))
			return new BigInteger(a, b, c);

		if (a != null)
			if ("number" == typeof a) this.fromNumber(a, b, c);
			else if (b == null && "string" != typeof a) this.fromString(a, 256);
			else this.fromString(a, b);
	};

	// Bits per digit
	var dbits;

	// JavaScript engine analysis
	var canary = 0xdeadbeefcafe;
	var j_lm = ((canary & 0xffffff) == 0xefcafe);

	// return new, unset BigInteger
	function nbi() { return new BigInteger(null); }

	// am: Compute w_j += (x*this_i), propagate carries,
	// c is initial carry, returns final carry.
	// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
	// We need to select the fastest one that works in this environment.

	// am1: use a single mult and divide to get the high bits,
	// max digit bits should be 26 because
	// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
	function am1(i, x, w, j, c, n) {
		while (--n >= 0) {
			var v = x * this[i++] + w[j] + c;
			c = Math.floor(v / 0x4000000);
			w[j++] = v & 0x3ffffff;
		}
		return c;
	}
	// am2 avoids a big mult-and-extract completely.
	// Max digit bits should be <= 30 because we do bitwise ops
	// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
	function am2(i, x, w, j, c, n) {
		var xl = x & 0x7fff, xh = x >> 15;
		while (--n >= 0) {
			var l = this[i] & 0x7fff;
			var h = this[i++] >> 15;
			var m = xh * l + h * xl;
			l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
			c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
			w[j++] = l & 0x3fffffff;
		}
		return c;
	}
	// Alternately, set max digit bits to 28 since some
	// browsers slow down when dealing with 32-bit numbers.
	function am3(i, x, w, j, c, n) {
		var xl = x & 0x3fff, xh = x >> 14;
		while (--n >= 0) {
			var l = this[i] & 0x3fff;
			var h = this[i++] >> 14;
			var m = xh * l + h * xl;
			l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
			c = (l >> 28) + (m >> 14) + xh * h;
			w[j++] = l & 0xfffffff;
		}
		return c;
	}
	if (j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
		BigInteger.prototype.am = am2;
		dbits = 30;
	}
	else if (j_lm && (navigator.appName != "Netscape")) {
		BigInteger.prototype.am = am1;
		dbits = 26;
	}
	else { // Mozilla/Netscape seems to prefer am3
		BigInteger.prototype.am = am3;
		dbits = 28;
	}

	BigInteger.prototype.DB = dbits;
	BigInteger.prototype.DM = ((1 << dbits) - 1);
	BigInteger.prototype.DV = (1 << dbits);

	var BI_FP = 52;
	BigInteger.prototype.FV = Math.pow(2, BI_FP);
	BigInteger.prototype.F1 = BI_FP - dbits;
	BigInteger.prototype.F2 = 2 * dbits - BI_FP;

	// Digit conversions
	var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
	var BI_RC = new Array();
	var rr, vv;
	rr = "0".charCodeAt(0);
	for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
	rr = "a".charCodeAt(0);
	for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
	rr = "A".charCodeAt(0);
	for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

	function int2char(n) { return BI_RM.charAt(n); }
	function intAt(s, i) {
		var c = BI_RC[s.charCodeAt(i)];
		return (c == null) ? -1 : c;
	}

	// return bigint initialized to value
	function nbv(i) { var r = nbi(); r.fromInt(i); return r; }


	// returns bit length of the integer x
	function nbits(x) {
		var r = 1, t;
		if ((t = x >>> 16) != 0) { x = t; r += 16; }
		if ((t = x >> 8) != 0) { x = t; r += 8; }
		if ((t = x >> 4) != 0) { x = t; r += 4; }
		if ((t = x >> 2) != 0) { x = t; r += 2; }
		if ((t = x >> 1) != 0) { x = t; r += 1; }
		return r;
	}

	// (protected) copy this to r
	BigInteger.prototype.copyTo = function (r) {
		for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
		r.t = this.t;
		r.s = this.s;
	};

	// (protected) set from integer value x, -DV <= x < DV
	BigInteger.prototype.fromInt = function (x) {
		this.t = 1;
		this.s = (x < 0) ? -1 : 0;
		if (x > 0) this[0] = x;
		else if (x < -1) this[0] = x + this.DV;
		else this.t = 0;
	};

	// (protected) set from string and radix
	BigInteger.prototype.fromString = function (s, b) {
		var k;
		if (b == 16) k = 4;
		else if (b == 8) k = 3;
		else if (b == 256) k = 8; // byte array
		else if (b == 2) k = 1;
		else if (b == 32) k = 5;
		else if (b == 4) k = 2;
		else { this.fromRadix(s, b); return; }
		this.t = 0;
		this.s = 0;
		var i = s.length, mi = false, sh = 0;
		while (--i >= 0) {
			var x = (k == 8) ? s[i] & 0xff : intAt(s, i);
			if (x < 0) {
				if (s.charAt(i) == "-") mi = true;
				continue;
			}
			mi = false;
			if (sh == 0)
				this[this.t++] = x;
			else if (sh + k > this.DB) {
				this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
				this[this.t++] = (x >> (this.DB - sh));
			}
			else
				this[this.t - 1] |= x << sh;
			sh += k;
			if (sh >= this.DB) sh -= this.DB;
		}
		if (k == 8 && (s[0] & 0x80) != 0) {
			this.s = -1;
			if (sh > 0) this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
		}
		this.clamp();
		if (mi) BigInteger.ZERO.subTo(this, this);
	};


	// (protected) clamp off excess high words
	BigInteger.prototype.clamp = function () {
		var c = this.s & this.DM;
		while (this.t > 0 && this[this.t - 1] == c) --this.t;
	};

	// (protected) r = this << n*DB
	BigInteger.prototype.dlShiftTo = function (n, r) {
		var i;
		for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
		for (i = n - 1; i >= 0; --i) r[i] = 0;
		r.t = this.t + n;
		r.s = this.s;
	};

	// (protected) r = this >> n*DB
	BigInteger.prototype.drShiftTo = function (n, r) {
		for (var i = n; i < this.t; ++i) r[i - n] = this[i];
		r.t = Math.max(this.t - n, 0);
		r.s = this.s;
	};


	// (protected) r = this << n
	BigInteger.prototype.lShiftTo = function (n, r) {
		var bs = n % this.DB;
		var cbs = this.DB - bs;
		var bm = (1 << cbs) - 1;
		var ds = Math.floor(n / this.DB), c = (this.s << bs) & this.DM, i;
		for (i = this.t - 1; i >= 0; --i) {
			r[i + ds + 1] = (this[i] >> cbs) | c;
			c = (this[i] & bm) << bs;
		}
		for (i = ds - 1; i >= 0; --i) r[i] = 0;
		r[ds] = c;
		r.t = this.t + ds + 1;
		r.s = this.s;
		r.clamp();
	};


	// (protected) r = this >> n
	BigInteger.prototype.rShiftTo = function (n, r) {
		r.s = this.s;
		var ds = Math.floor(n / this.DB);
		if (ds >= this.t) { r.t = 0; return; }
		var bs = n % this.DB;
		var cbs = this.DB - bs;
		var bm = (1 << bs) - 1;
		r[0] = this[ds] >> bs;
		for (var i = ds + 1; i < this.t; ++i) {
			r[i - ds - 1] |= (this[i] & bm) << cbs;
			r[i - ds] = this[i] >> bs;
		}
		if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
		r.t = this.t - ds;
		r.clamp();
	};


	// (protected) r = this - a
	BigInteger.prototype.subTo = function (a, r) {
		var i = 0, c = 0, m = Math.min(a.t, this.t);
		while (i < m) {
			c += this[i] - a[i];
			r[i++] = c & this.DM;
			c >>= this.DB;
		}
		if (a.t < this.t) {
			c -= a.s;
			while (i < this.t) {
				c += this[i];
				r[i++] = c & this.DM;
				c >>= this.DB;
			}
			c += this.s;
		}
		else {
			c += this.s;
			while (i < a.t) {
				c -= a[i];
				r[i++] = c & this.DM;
				c >>= this.DB;
			}
			c -= a.s;
		}
		r.s = (c < 0) ? -1 : 0;
		if (c < -1) r[i++] = this.DV + c;
		else if (c > 0) r[i++] = c;
		r.t = i;
		r.clamp();
	};


	// (protected) r = this * a, r != this,a (HAC 14.12)
	// "this" should be the larger one if appropriate.
	BigInteger.prototype.multiplyTo = function (a, r) {
		var x = this.abs(), y = a.abs();
		var i = x.t;
		r.t = i + y.t;
		while (--i >= 0) r[i] = 0;
		for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
		r.s = 0;
		r.clamp();
		if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
	};


	// (protected) r = this^2, r != this (HAC 14.16)
	BigInteger.prototype.squareTo = function (r) {
		var x = this.abs();
		var i = r.t = 2 * x.t;
		while (--i >= 0) r[i] = 0;
		for (i = 0; i < x.t - 1; ++i) {
			var c = x.am(i, x[i], r, 2 * i, 0, 1);
			if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
				r[i + x.t] -= x.DV;
				r[i + x.t + 1] = 1;
			}
		}
		if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
		r.s = 0;
		r.clamp();
	};



	// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
	// r != q, this != m.  q or r may be null.
	BigInteger.prototype.divRemTo = function (m, q, r) {
		var pm = m.abs();
		if (pm.t <= 0) return;
		var pt = this.abs();
		if (pt.t < pm.t) {
			if (q != null) q.fromInt(0);
			if (r != null) this.copyTo(r);
			return;
		}
		if (r == null) r = nbi();
		var y = nbi(), ts = this.s, ms = m.s;
		var nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus
		if (nsh > 0) { pm.lShiftTo(nsh, y); pt.lShiftTo(nsh, r); }
		else { pm.copyTo(y); pt.copyTo(r); }
		var ys = y.t;
		var y0 = y[ys - 1];
		if (y0 == 0) return;
		var yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
		var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
		var i = r.t, j = i - ys, t = (q == null) ? nbi() : q;
		y.dlShiftTo(j, t);
		if (r.compareTo(t) >= 0) {
			r[r.t++] = 1;
			r.subTo(t, r);
		}
		BigInteger.ONE.dlShiftTo(ys, t);
		t.subTo(y, y); // "negative" y so we can replace sub with am later
		while (y.t < ys) y[y.t++] = 0;
		while (--j >= 0) {
			// Estimate quotient digit
			var qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
			if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {	// Try it out
				y.dlShiftTo(j, t);
				r.subTo(t, r);
				while (r[i] < --qd) r.subTo(t, r);
			}
		}
		if (q != null) {
			r.drShiftTo(ys, q);
			if (ts != ms) BigInteger.ZERO.subTo(q, q);
		}
		r.t = ys;
		r.clamp();
		if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
		if (ts < 0) BigInteger.ZERO.subTo(r, r);
	};


	// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
	// justification:
	//         xy == 1 (mod m)
	//         xy =  1+km
	//   xy(2-xy) = (1+km)(1-km)
	// x[y(2-xy)] = 1-k^2m^2
	// x[y(2-xy)] == 1 (mod m^2)
	// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
	// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
	// JS multiply "overflows" differently from C/C++, so care is needed here.
	BigInteger.prototype.invDigit = function () {
		if (this.t < 1) return 0;
		var x = this[0];
		if ((x & 1) == 0) return 0;
		var y = x & 3; 	// y == 1/x mod 2^2
		y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
		y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
		y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
		// last step - calculate inverse mod DV directly;
		// assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
		y = (y * (2 - x * y % this.DV)) % this.DV; 	// y == 1/x mod 2^dbits
		// we really want the negative inverse, and -DV < y < DV
		return (y > 0) ? this.DV - y : -y;
	};


	// (protected) true iff this is even
	BigInteger.prototype.isEven = function () { return ((this.t > 0) ? (this[0] & 1) : this.s) == 0; };


	// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
	BigInteger.prototype.exp = function (e, z) {
		if (e > 0xffffffff || e < 1) return BigInteger.ONE;
		var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e) - 1;
		g.copyTo(r);
		while (--i >= 0) {
			z.sqrTo(r, r2);
			if ((e & (1 << i)) > 0) z.mulTo(r2, g, r);
			else { var t = r; r = r2; r2 = t; }
		}
		return z.revert(r);
	};


	// (public) return string representation in given radix
	BigInteger.prototype.toString = function (b) {
		if (this.s < 0) return "-" + this.negate().toString(b);
		var k;
		if (b == 16) k = 4;
		else if (b == 8) k = 3;
		else if (b == 2) k = 1;
		else if (b == 32) k = 5;
		else if (b == 4) k = 2;
		else return this.toRadix(b);
		var km = (1 << k) - 1, d, m = false, r = "", i = this.t;
		var p = this.DB - (i * this.DB) % k;
		if (i-- > 0) {
			if (p < this.DB && (d = this[i] >> p) > 0) { m = true; r = int2char(d); }
			while (i >= 0) {
				if (p < k) {
					d = (this[i] & ((1 << p) - 1)) << (k - p);
					d |= this[--i] >> (p += this.DB - k);
				}
				else {
					d = (this[i] >> (p -= k)) & km;
					if (p <= 0) { p += this.DB; --i; }
				}
				if (d > 0) m = true;
				if (m) r += int2char(d);
			}
		}
		return m ? r : "0";
	};


	// (public) -this
	BigInteger.prototype.negate = function () { var r = nbi(); BigInteger.ZERO.subTo(this, r); return r; };

	// (public) |this|
	BigInteger.prototype.abs = function () { return (this.s < 0) ? this.negate() : this; };

	// (public) return + if this > a, - if this < a, 0 if equal
	BigInteger.prototype.compareTo = function (a) {
		var r = this.s - a.s;
		if (r != 0) return r;
		var i = this.t;
		r = i - a.t;
		if (r != 0) return (this.s < 0) ? -r : r;
		while (--i >= 0) if ((r = this[i] - a[i]) != 0) return r;
		return 0;
	}

	// (public) return the number of bits in "this"
	BigInteger.prototype.bitLength = function () {
		if (this.t <= 0) return 0;
		return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
	};

	// (public) this mod a
	BigInteger.prototype.mod = function (a) {
		var r = nbi();
		this.abs().divRemTo(a, null, r);
		if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
		return r;
	}

	// (public) this^e % m, 0 <= e < 2^32
	BigInteger.prototype.modPowInt = function (e, m) {
		var z;
		if (e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
		return this.exp(e, z);
	};

	// "constants"
	BigInteger.ZERO = nbv(0);
	BigInteger.ONE = nbv(1);

	// return index of lowest 1-bit in x, x < 2^31
	function lbit(x) {
		if (x == 0) return -1;
		var r = 0;
		if ((x & 0xffff) == 0) { x >>= 16; r += 16; }
		if ((x & 0xff) == 0) { x >>= 8; r += 8; }
		if ((x & 0xf) == 0) { x >>= 4; r += 4; }
		if ((x & 3) == 0) { x >>= 2; r += 2; }
		if ((x & 1) == 0) ++r;
		return r;
	}

	// return number of 1 bits in x
	function cbit(x) {
		var r = 0;
		while (x != 0) { x &= x - 1; ++r; }
		return r;
	}

	var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
	var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];



	// (protected) return x s.t. r^x < DV
	BigInteger.prototype.chunkSize = function (r) { return Math.floor(Math.LN2 * this.DB / Math.log(r)); };

	// (protected) convert to radix string
	BigInteger.prototype.toRadix = function (b) {
		if (b == null) b = 10;
		if (this.signum() == 0 || b < 2 || b > 36) return "0";
		var cs = this.chunkSize(b);
		var a = Math.pow(b, cs);
		var d = nbv(a), y = nbi(), z = nbi(), r = "";
		this.divRemTo(d, y, z);
		while (y.signum() > 0) {
			r = (a + z.intValue()).toString(b).substr(1) + r;
			y.divRemTo(d, y, z);
		}
		return z.intValue().toString(b) + r;
	};

	// (protected) convert from radix string
	BigInteger.prototype.fromRadix = function (s, b) {
		this.fromInt(0);
		if (b == null) b = 10;
		var cs = this.chunkSize(b);
		var d = Math.pow(b, cs), mi = false, j = 0, w = 0;
		for (var i = 0; i < s.length; ++i) {
			var x = intAt(s, i);
			if (x < 0) {
				if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
				continue;
			}
			w = b * w + x;
			if (++j >= cs) {
				this.dMultiply(d);
				this.dAddOffset(w, 0);
				j = 0;
				w = 0;
			}
		}
		if (j > 0) {
			this.dMultiply(Math.pow(b, j));
			this.dAddOffset(w, 0);
		}
		if (mi) BigInteger.ZERO.subTo(this, this);
	};

	// (protected) alternate constructor
	BigInteger.prototype.fromNumber = function (a, b, c) {
		if ("number" == typeof b) {
			// new BigInteger(int,int,RNG)
			if (a < 2) this.fromInt(1);
			else {
				this.fromNumber(a, c);
				if (!this.testBit(a - 1))	// force MSB set
					this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
				if (this.isEven()) this.dAddOffset(1, 0); // force odd
				while (!this.isProbablePrime(b)) {
					this.dAddOffset(2, 0);
					if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
				}
			}
		}
		else {
			// new BigInteger(int,RNG)
			var x = new Array(), t = a & 7;
			x.length = (a >> 3) + 1;
			b.nextBytes(x);
			if (t > 0) x[0] &= ((1 << t) - 1); else x[0] = 0;
			this.fromString(x, 256);
		}
	};

	// (protected) r = this op a (bitwise)
	BigInteger.prototype.bitwiseTo = function (a, op, r) {
		var i, f, m = Math.min(a.t, this.t);
		for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
		if (a.t < this.t) {
			f = a.s & this.DM;
			for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
			r.t = this.t;
		}
		else {
			f = this.s & this.DM;
			for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
			r.t = a.t;
		}
		r.s = op(this.s, a.s);
		r.clamp();
	};

	// (protected) this op (1<<n)
	BigInteger.prototype.changeBit = function (n, op) {
		var r = BigInteger.ONE.shiftLeft(n);
		this.bitwiseTo(r, op, r);
		return r;
	};

	// (protected) r = this + a
	BigInteger.prototype.addTo = function (a, r) {
		var i = 0, c = 0, m = Math.min(a.t, this.t);
		while (i < m) {
			c += this[i] + a[i];
			r[i++] = c & this.DM;
			c >>= this.DB;
		}
		if (a.t < this.t) {
			c += a.s;
			while (i < this.t) {
				c += this[i];
				r[i++] = c & this.DM;
				c >>= this.DB;
			}
			c += this.s;
		}
		else {
			c += this.s;
			while (i < a.t) {
				c += a[i];
				r[i++] = c & this.DM;
				c >>= this.DB;
			}
			c += a.s;
		}
		r.s = (c < 0) ? -1 : 0;
		if (c > 0) r[i++] = c;
		else if (c < -1) r[i++] = this.DV + c;
		r.t = i;
		r.clamp();
	};

	// (protected) this *= n, this >= 0, 1 < n < DV
	BigInteger.prototype.dMultiply = function (n) {
		this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
		++this.t;
		this.clamp();
	};

	// (protected) this += n << w words, this >= 0
	BigInteger.prototype.dAddOffset = function (n, w) {
		if (n == 0) return;
		while (this.t <= w) this[this.t++] = 0;
		this[w] += n;
		while (this[w] >= this.DV) {
			this[w] -= this.DV;
			if (++w >= this.t) this[this.t++] = 0;
			++this[w];
		}
	};

	// (protected) r = lower n words of "this * a", a.t <= n
	// "this" should be the larger one if appropriate.
	BigInteger.prototype.multiplyLowerTo = function (a, n, r) {
		var i = Math.min(this.t + a.t, n);
		r.s = 0; // assumes a,this >= 0
		r.t = i;
		while (i > 0) r[--i] = 0;
		var j;
		for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
		for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
		r.clamp();
	};


	// (protected) r = "this * a" without lower n words, n > 0
	// "this" should be the larger one if appropriate.
	BigInteger.prototype.multiplyUpperTo = function (a, n, r) {
		--n;
		var i = r.t = this.t + a.t - n;
		r.s = 0; // assumes a,this >= 0
		while (--i >= 0) r[i] = 0;
		for (i = Math.max(n - this.t, 0); i < a.t; ++i)
			r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
		r.clamp();
		r.drShiftTo(1, r);
	};

	// (protected) this % n, n < 2^26
	BigInteger.prototype.modInt = function (n) {
		if (n <= 0) return 0;
		var d = this.DV % n, r = (this.s < 0) ? n - 1 : 0;
		if (this.t > 0)
			if (d == 0) r = this[0] % n;
			else for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
		return r;
	};


	// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
	BigInteger.prototype.millerRabin = function (t) {
		var n1 = this.subtract(BigInteger.ONE);
		var k = n1.getLowestSetBit();
		if (k <= 0) return false;
		var r = n1.shiftRight(k);
		t = (t + 1) >> 1;
		if (t > lowprimes.length) t = lowprimes.length;
		var a = nbi();
		for (var i = 0; i < t; ++i) {
			//Pick bases at random, instead of starting at 2
			a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
			var y = a.modPow(r, this);
			if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
				var j = 1;
				while (j++ < k && y.compareTo(n1) != 0) {
					y = y.modPowInt(2, this);
					if (y.compareTo(BigInteger.ONE) == 0) return false;
				}
				if (y.compareTo(n1) != 0) return false;
			}
		}
		return true;
	};



	// (public)
	BigInteger.prototype.clone = function () { var r = nbi(); this.copyTo(r); return r; };

	// (public) return value as integer
	BigInteger.prototype.intValue = function () {
		if (this.s < 0) {
			if (this.t == 1) return this[0] - this.DV;
			else if (this.t == 0) return -1;
		}
		else if (this.t == 1) return this[0];
		else if (this.t == 0) return 0;
		// assumes 16 < DB < 32
		return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
	};


	// (public) return value as byte
	BigInteger.prototype.byteValue = function () { return (this.t == 0) ? this.s : (this[0] << 24) >> 24; };

	// (public) return value as short (assumes DB>=16)
	BigInteger.prototype.shortValue = function () { return (this.t == 0) ? this.s : (this[0] << 16) >> 16; };

	// (public) 0 if this == 0, 1 if this > 0
	BigInteger.prototype.signum = function () {
		if (this.s < 0) return -1;
		else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
		else return 1;
	};


	// (public) convert to bigendian byte array
	BigInteger.prototype.toByteArray = function () {
		var i = this.t, r = new Array();
		r[0] = this.s;
		var p = this.DB - (i * this.DB) % 8, d, k = 0;
		if (i-- > 0) {
			if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p)
				r[k++] = d | (this.s << (this.DB - p));
			while (i >= 0) {
				if (p < 8) {
					d = (this[i] & ((1 << p) - 1)) << (8 - p);
					d |= this[--i] >> (p += this.DB - 8);
				}
				else {
					d = (this[i] >> (p -= 8)) & 0xff;
					if (p <= 0) { p += this.DB; --i; }
				}
				if ((d & 0x80) != 0) d |= -256;
				if (k == 0 && (this.s & 0x80) != (d & 0x80)) ++k;
				if (k > 0 || d != this.s) r[k++] = d;
			}
		}
		return r;
	};

	BigInteger.prototype.equals = function (a) { return (this.compareTo(a) == 0); };
	BigInteger.prototype.min = function (a) { return (this.compareTo(a) < 0) ? this : a; };
	BigInteger.prototype.max = function (a) { return (this.compareTo(a) > 0) ? this : a; };

	// (public) this & a
	function op_and(x, y) { return x & y; }
	BigInteger.prototype.and = function (a) { var r = nbi(); this.bitwiseTo(a, op_and, r); return r; };

	// (public) this | a
	function op_or(x, y) { return x | y; }
	BigInteger.prototype.or = function (a) { var r = nbi(); this.bitwiseTo(a, op_or, r); return r; };

	// (public) this ^ a
	function op_xor(x, y) { return x ^ y; }
	BigInteger.prototype.xor = function (a) { var r = nbi(); this.bitwiseTo(a, op_xor, r); return r; };

	// (public) this & ~a
	function op_andnot(x, y) { return x & ~y; }
	BigInteger.prototype.andNot = function (a) { var r = nbi(); this.bitwiseTo(a, op_andnot, r); return r; };

	// (public) ~this
	BigInteger.prototype.not = function () {
		var r = nbi();
		for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
		r.t = this.t;
		r.s = ~this.s;
		return r;
	};

	// (public) this << n
	BigInteger.prototype.shiftLeft = function (n) {
		var r = nbi();
		if (n < 0) this.rShiftTo(-n, r); else this.lShiftTo(n, r);
		return r;
	};

	// (public) this >> n
	BigInteger.prototype.shiftRight = function (n) {
		var r = nbi();
		if (n < 0) this.lShiftTo(-n, r); else this.rShiftTo(n, r);
		return r;
	};

	// (public) returns index of lowest 1-bit (or -1 if none)
	BigInteger.prototype.getLowestSetBit = function () {
		for (var i = 0; i < this.t; ++i)
			if (this[i] != 0) return i * this.DB + lbit(this[i]);
		if (this.s < 0) return this.t * this.DB;
		return -1;
	};

	// (public) return number of set bits
	BigInteger.prototype.bitCount = function () {
		var r = 0, x = this.s & this.DM;
		for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);
		return r;
	};

	// (public) true iff nth bit is set
	BigInteger.prototype.testBit = function (n) {
		var j = Math.floor(n / this.DB);
		if (j >= this.t) return (this.s != 0);
		return ((this[j] & (1 << (n % this.DB))) != 0);
	};

	// (public) this | (1<<n)
	BigInteger.prototype.setBit = function (n) { return this.changeBit(n, op_or); };
	// (public) this & ~(1<<n)
	BigInteger.prototype.clearBit = function (n) { return this.changeBit(n, op_andnot); };
	// (public) this ^ (1<<n)
	BigInteger.prototype.flipBit = function (n) { return this.changeBit(n, op_xor); };
	// (public) this + a
	BigInteger.prototype.add = function (a) { var r = nbi(); this.addTo(a, r); return r; };
	// (public) this - a
	BigInteger.prototype.subtract = function (a) { var r = nbi(); this.subTo(a, r); return r; };
	// (public) this * a
	BigInteger.prototype.multiply = function (a) { var r = nbi(); this.multiplyTo(a, r); return r; };
	// (public) this / a
	BigInteger.prototype.divide = function (a) { var r = nbi(); this.divRemTo(a, r, null); return r; };
	// (public) this % a
	BigInteger.prototype.remainder = function (a) { var r = nbi(); this.divRemTo(a, null, r); return r; };
	// (public) [this/a,this%a]
	BigInteger.prototype.divideAndRemainder = function (a) {
		var q = nbi(), r = nbi();
		this.divRemTo(a, q, r);
		return new Array(q, r);
	};

	// (public) this^e % m (HAC 14.85)
	BigInteger.prototype.modPow = function (e, m) {
		var i = e.bitLength(), k, r = nbv(1), z;
		if (i <= 0) return r;
		else if (i < 18) k = 1;
		else if (i < 48) k = 3;
		else if (i < 144) k = 4;
		else if (i < 768) k = 5;
		else k = 6;
		if (i < 8)
			z = new Classic(m);
		else if (m.isEven())
			z = new Barrett(m);
		else
			z = new Montgomery(m);

		// precomputation
		var g = new Array(), n = 3, k1 = k - 1, km = (1 << k) - 1;
		g[1] = z.convert(this);
		if (k > 1) {
			var g2 = nbi();
			z.sqrTo(g[1], g2);
			while (n <= km) {
				g[n] = nbi();
				z.mulTo(g2, g[n - 2], g[n]);
				n += 2;
			}
		}

		var j = e.t - 1, w, is1 = true, r2 = nbi(), t;
		i = nbits(e[j]) - 1;
		while (j >= 0) {
			if (i >= k1) w = (e[j] >> (i - k1)) & km;
			else {
				w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
				if (j > 0) w |= e[j - 1] >> (this.DB + i - k1);
			}

			n = k;
			while ((w & 1) == 0) { w >>= 1; --n; }
			if ((i -= n) < 0) { i += this.DB; --j; }
			if (is1) {	// ret == 1, don't bother squaring or multiplying it
				g[w].copyTo(r);
				is1 = false;
			}
			else {
				while (n > 1) { z.sqrTo(r, r2); z.sqrTo(r2, r); n -= 2; }
				if (n > 0) z.sqrTo(r, r2); else { t = r; r = r2; r2 = t; }
				z.mulTo(r2, g[w], r);
			}

			while (j >= 0 && (e[j] & (1 << i)) == 0) {
				z.sqrTo(r, r2); t = r; r = r2; r2 = t;
				if (--i < 0) { i = this.DB - 1; --j; }
			}
		}
		return z.revert(r);
	};

	// (public) 1/this % m (HAC 14.61)
	BigInteger.prototype.modInverse = function (m) {
		var ac = m.isEven();
		if (this.signum() === 0) throw new Error('division by zero');
		if ((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
		var u = m.clone(), v = this.clone();
		var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
		while (u.signum() != 0) {
			while (u.isEven()) {
				u.rShiftTo(1, u);
				if (ac) {
					if (!a.isEven() || !b.isEven()) { a.addTo(this, a); b.subTo(m, b); }
					a.rShiftTo(1, a);
				}
				else if (!b.isEven()) b.subTo(m, b);
				b.rShiftTo(1, b);
			}
			while (v.isEven()) {
				v.rShiftTo(1, v);
				if (ac) {
					if (!c.isEven() || !d.isEven()) { c.addTo(this, c); d.subTo(m, d); }
					c.rShiftTo(1, c);
				}
				else if (!d.isEven()) d.subTo(m, d);
				d.rShiftTo(1, d);
			}
			if (u.compareTo(v) >= 0) {
				u.subTo(v, u);
				if (ac) a.subTo(c, a);
				b.subTo(d, b);
			}
			else {
				v.subTo(u, v);
				if (ac) c.subTo(a, c);
				d.subTo(b, d);
			}
		}
		if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
		while (d.compareTo(m) >= 0) d.subTo(m, d);
		while (d.signum() < 0) d.addTo(m, d);
		return d;
	};


	// (public) this^e
	BigInteger.prototype.pow = function (e) { return this.exp(e, new NullExp()); };

	// (public) gcd(this,a) (HAC 14.54)
	BigInteger.prototype.gcd = function (a) {
		var x = (this.s < 0) ? this.negate() : this.clone();
		var y = (a.s < 0) ? a.negate() : a.clone();
		if (x.compareTo(y) < 0) { var t = x; x = y; y = t; }
		var i = x.getLowestSetBit(), g = y.getLowestSetBit();
		if (g < 0) return x;
		if (i < g) g = i;
		if (g > 0) {
			x.rShiftTo(g, x);
			y.rShiftTo(g, y);
		}
		while (x.signum() > 0) {
			if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
			if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
			if (x.compareTo(y) >= 0) {
				x.subTo(y, x);
				x.rShiftTo(1, x);
			}
			else {
				y.subTo(x, y);
				y.rShiftTo(1, y);
			}
		}
		if (g > 0) y.lShiftTo(g, y);
		return y;
	};

	// (public) test primality with certainty >= 1-.5^t
	BigInteger.prototype.isProbablePrime = function (t) {
		var i, x = this.abs();
		if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
			for (i = 0; i < lowprimes.length; ++i)
				if (x[0] == lowprimes[i]) return true;
			return false;
		}
		if (x.isEven()) return false;
		i = 1;
		while (i < lowprimes.length) {
			var m = lowprimes[i], j = i + 1;
			while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
			m = x.modInt(m);
			while (i < j) if (m % lowprimes[i++] == 0) return false;
		}
		return x.millerRabin(t);
	};


	// JSBN-specific extension

	// (public) this^2
	BigInteger.prototype.square = function () { var r = nbi(); this.squareTo(r); return r; };

	BigInteger.valueOf = nbv;

	/**
	* Returns a byte array representation of the big integer.
	*
	* This returns the absolute of the contained value in big endian
	* form. A value of zero results in an empty array.
	*/
	BigInteger.prototype.toByteArrayUnsigned = function () {
		var ba = this.abs().toByteArray();
		if (ba.length) {
			if (ba[0] == 0) {
				ba = ba.slice(1);
			}
			return ba.map(function (v) {
				return (v < 0) ? v + 256 : v;
			});
		} else {
			// Empty array, nothing to do
			return ba;
		}
	};

	/**
	* Turns a byte array into a big integer.
	*
	* This function will interpret a byte array as a big integer in big
	* endian notation and ignore leading zeros.
	*/
	BigInteger.fromByteArrayUnsigned = function (ba) {
		if (!ba.length) {
			return ba.valueOf(0);
		} else if (ba[0] & 0x80) {
			// Prepend a zero so the BigInteger class doesn't mistake this
			// for a negative integer.
			return new BigInteger([0].concat(ba));
		} else {
			return new BigInteger(ba);
		}
	};

	/**
	* Converts big integer to signed byte representation.
	*
	* The format for this value uses a the most significant bit as a sign
	* bit. If the most significant bit is already occupied by the
	* absolute value, an extra byte is prepended and the sign bit is set
	* there.
	*
	* Examples:
	*
	*      0 =>     0x00
	*      1 =>     0x01
	*     -1 =>     0x81
	*    127 =>     0x7f
	*   -127 =>     0xff
	*    128 =>   0x0080
	*   -128 =>   0x8080
	*    255 =>   0x00ff
	*   -255 =>   0x80ff
	*  16300 =>   0x3fac
	* -16300 =>   0xbfac
	*  62300 => 0x00f35c
	* -62300 => 0x80f35c
	*/
	BigInteger.prototype.toByteArraySigned = function () {
		var val = this.abs().toByteArrayUnsigned();
		var neg = this.compareTo(BigInteger.ZERO) < 0;

		if (neg) {
			if (val[0] & 0x80) {
				val.unshift(0x80);
			} else {
				val[0] |= 0x80;
			}
		} else {
			if (val[0] & 0x80) {
				val.unshift(0x00);
			}
		}

		return val;
	};

	/**
	* Parse a signed big integer byte representation.
	*
	* For details on the format please see BigInteger.toByteArraySigned.
	*/
	BigInteger.fromByteArraySigned = function (ba) {
		// Check for negative value
		if (ba[0] & 0x80) {
			// Remove sign bit
			ba[0] &= 0x7f;

			return BigInteger.fromByteArrayUnsigned(ba).negate();
		} else {
			return BigInteger.fromByteArrayUnsigned(ba);
		}
	};

	// ****** REDUCTION ******* //
	// Modular reduction using "classic" algorithm
	var Classic = window.Classic = function Classic(m) { this.m = m; }
	Classic.prototype.convert = function (x) {
		if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
		else return x;
	};
	Classic.prototype.revert = function (x) { return x; };
	Classic.prototype.reduce = function (x) { x.divRemTo(this.m, null, x); };
	Classic.prototype.mulTo = function (x, y, r) { x.multiplyTo(y, r); this.reduce(r); };
	Classic.prototype.sqrTo = function (x, r) { x.squareTo(r); this.reduce(r); };

	// Montgomery reduction
	var Montgomery = window.Montgomery = function Montgomery(m) {
		this.m = m;
		this.mp = m.invDigit();
		this.mpl = this.mp & 0x7fff;
		this.mph = this.mp >> 15;
		this.um = (1 << (m.DB - 15)) - 1;
		this.mt2 = 2 * m.t;
	}
	// xR mod m
	Montgomery.prototype.convert = function (x) {
		var r = nbi();
		x.abs().dlShiftTo(this.m.t, r);
		r.divRemTo(this.m, null, r);
		if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
		return r;
	}
	// x/R mod m
	Montgomery.prototype.revert = function (x) {
		var r = nbi();
		x.copyTo(r);
		this.reduce(r);
		return r;
	};
	// x = x/R mod m (HAC 14.32)
	Montgomery.prototype.reduce = function (x) {
		while (x.t <= this.mt2)	// pad x so am has enough room later
			x[x.t++] = 0;
		for (var i = 0; i < this.m.t; ++i) {
			// faster way of calculating u0 = x[i]*mp mod DV
			var j = x[i] & 0x7fff;
			var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
			// use am to combine the multiply-shift-add into one call
			j = i + this.m.t;
			x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
			// propagate carry
			while (x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
		}
		x.clamp();
		x.drShiftTo(this.m.t, x);
		if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
	};
	// r = "xy/R mod m"; x,y != r
	Montgomery.prototype.mulTo = function (x, y, r) { x.multiplyTo(y, r); this.reduce(r); };
	// r = "x^2/R mod m"; x != r
	Montgomery.prototype.sqrTo = function (x, r) { x.squareTo(r); this.reduce(r); };

	// A "null" reducer
	var NullExp = window.NullExp = function NullExp() { }
	NullExp.prototype.convert = function (x) { return x; };
	NullExp.prototype.revert = function (x) { return x; };
	NullExp.prototype.mulTo = function (x, y, r) { x.multiplyTo(y, r); };
	NullExp.prototype.sqrTo = function (x, r) { x.squareTo(r); };

	// Barrett modular reduction
	var Barrett = window.Barrett = function Barrett(m) {
		// setup Barrett
		this.r2 = nbi();
		this.q3 = nbi();
		BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
		this.mu = this.r2.divide(m);
		this.m = m;
	}
	Barrett.prototype.convert = function (x) {
		if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
		else if (x.compareTo(this.m) < 0) return x;
		else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
	};
	Barrett.prototype.revert = function (x) { return x; };
	// x = x mod m (HAC 14.42)
	Barrett.prototype.reduce = function (x) {
		x.drShiftTo(this.m.t - 1, this.r2);
		if (x.t > this.m.t + 1) { x.t = this.m.t + 1; x.clamp(); }
		this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
		this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
		while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
		x.subTo(this.r2, x);
		while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
	};
	// r = x*y mod m; x,y != r
	Barrett.prototype.mulTo = function (x, y, r) { x.multiplyTo(y, r); this.reduce(r); };
	// r = x^2 mod m; x != r
	Barrett.prototype.sqrTo = function (x, r) { x.squareTo(r); this.reduce(r); };

})();

(function (exports) {
	var Bitcoin = exports;
})(
	'object' === typeof module ? module.exports : (window.Bitcoin = {})
);

(function (Bitcoin) {
	Bitcoin.Base58 = {
		alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
		validRegex: /^[1-9A-HJ-NP-Za-km-z]+$/,
		base: BigInteger.valueOf(58),

		/**
		* Convert a byte array to a base58-encoded string.
		*
		* Written by Mike Hearn for BitcoinJ.
		*   Copyright (c) 2011 Google Inc.
		*
		* Ported to JavaScript by Stefan Thomas.
		*/
		encode: function (input) {
			var bi = BigInteger.fromByteArrayUnsigned(input);
			var chars = [];

			while (bi.compareTo(B58.base) >= 0) {
				var mod = bi.mod(B58.base);
				chars.unshift(B58.alphabet[mod.intValue()]);
				bi = bi.subtract(mod).divide(B58.base);
			}
			chars.unshift(B58.alphabet[bi.intValue()]);

			// Convert leading zeros too.
			for (var i = 0; i < input.length; i++) {
				if (input[i] == 0x00) {
					chars.unshift(B58.alphabet[0]);
				} else break;
			}

			return chars.join('');
		},

		/**
		* Convert a base58-encoded string to a byte array.
		*
		* Written by Mike Hearn for BitcoinJ.
		*   Copyright (c) 2011 Google Inc.
		*
		* Ported to JavaScript by Stefan Thomas.
		*/
		decode: function (input) {
			var bi = BigInteger.valueOf(0);
			var leadingZerosNum = 0;
			for (var i = input.length - 1; i >= 0; i--) {
				var alphaIndex = B58.alphabet.indexOf(input[i]);
				if (alphaIndex < 0) {
					throw "Invalid character";
				}
				bi = bi.add(BigInteger.valueOf(alphaIndex)
								.multiply(B58.base.pow(input.length - 1 - i)));

				// This counts leading zero bytes
				if (input[i] == "1") leadingZerosNum++;
				else leadingZerosNum = 0;
			}
			var bytes = bi.toByteArrayUnsigned();

			// Add leading zeros
			while (leadingZerosNum-- > 0) bytes.unshift(0);

			return bytes;
		}
	};

	var B58 = Bitcoin.Base58;
})(
	'undefined' != typeof Bitcoin ? Bitcoin : module.exports
);

Bitcoin.Address = function (bytes) {
	if ("string" == typeof bytes) {
		bytes = Bitcoin.Address.decodeString(bytes);
	}
	this.hash = bytes;
	this.version = Bitcoin.Address.networkVersion;
};

Bitcoin.Address.networkVersion = 0x00; // mainnet

/**
* Serialize this object as a standard Bitcoin address.
*
* Returns the address as a base58-encoded string in the standardized format.
*/
Bitcoin.Address.prototype.toString = function () {
	// Get a copy of the hash
	var hash = this.hash.slice(0);

	// Version
	hash.unshift(this.version);
	var checksum = Crypto.SHA256(Crypto.SHA256(hash, { asBytes: true }), { asBytes: true });
	var bytes = hash.concat(checksum.slice(0, 4));
	return Bitcoin.Base58.encode(bytes);
};

Bitcoin.Address.prototype.getHashBase64 = function () {
	return Crypto.util.bytesToBase64(this.hash);
};

/**
* Parse a Bitcoin address contained in a string.
*/
Bitcoin.Address.decodeString = function (string) {
	var bytes = Bitcoin.Base58.decode(string);
	var hash = bytes.slice(0, 21);
	var checksum = Crypto.SHA256(Crypto.SHA256(hash, { asBytes: true }), { asBytes: true });

	if (checksum[0] != bytes[21] ||
			checksum[1] != bytes[22] ||
			checksum[2] != bytes[23] ||
			checksum[3] != bytes[24]) {
		throw "Checksum validation failed!";
	}

	var version = hash.shift();

	if (version != 0) {
		throw "Version " + version + " not supported!";
	}

	return hash;
};

Bitcoin.ECDSA = (function () {
	var ecparams = EllipticCurve.getSECCurveByName("secp256k1");
	var rng = new SecureRandom();

	var P_OVER_FOUR = null;

	function implShamirsTrick(P, k, Q, l) {
		var m = Math.max(k.bitLength(), l.bitLength());
		var Z = P.add2D(Q);
		var R = P.curve.getInfinity();

		for (var i = m - 1; i >= 0; --i) {
			R = R.twice2D();

			R.z = BigInteger.ONE;

			if (k.testBit(i)) {
				if (l.testBit(i)) {
					R = R.add2D(Z);
				} else {
					R = R.add2D(P);
				}
			} else {
				if (l.testBit(i)) {
					R = R.add2D(Q);
				}
			}
		}

		return R;
	};

	var ECDSA = {
		getBigRandom: function (limit) {
			return new BigInteger(limit.bitLength(), rng)
				.mod(limit.subtract(BigInteger.ONE))
				.add(BigInteger.ONE);
		},
		sign: function (hash, priv) {
			var d = priv;
			var n = ecparams.getN();
			var e = BigInteger.fromByteArrayUnsigned(hash);

			do {
				var k = ECDSA.getBigRandom(n);
				var G = ecparams.getG();
				var Q = G.multiply(k);
				var r = Q.getX().toBigInteger().mod(n);
			} while (r.compareTo(BigInteger.ZERO) <= 0);

			var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);

			return ECDSA.serializeSig(r, s);
		},

		verify: function (hash, sig, pubkey) {
			var r, s;
			if (Bitcoin.Util.isArray(sig)) {
				var obj = ECDSA.parseSig(sig);
				r = obj.r;
				s = obj.s;
			} else if ("object" === typeof sig && sig.r && sig.s) {
				r = sig.r;
				s = sig.s;
			} else {
				throw "Invalid value for signature";
			}

			var Q;
			if (pubkey instanceof ec.PointFp) {
				Q = pubkey;
			} else if (Bitcoin.Util.isArray(pubkey)) {
				Q = EllipticCurve.PointFp.decodeFrom(ecparams.getCurve(), pubkey);
			} else {
				throw "Invalid format for pubkey value, must be byte array or ec.PointFp";
			}
			var e = BigInteger.fromByteArrayUnsigned(hash);

			return ECDSA.verifyRaw(e, r, s, Q);
		},

		verifyRaw: function (e, r, s, Q) {
			var n = ecparams.getN();
			var G = ecparams.getG();

			if (r.compareTo(BigInteger.ONE) < 0 ||
          r.compareTo(n) >= 0)
				return false;

			if (s.compareTo(BigInteger.ONE) < 0 ||
          s.compareTo(n) >= 0)
				return false;

			var c = s.modInverse(n);

			var u1 = e.multiply(c).mod(n);
			var u2 = r.multiply(c).mod(n);

			var point = G.multiply(u1).add(Q.multiply(u2));

			var v = point.getX().toBigInteger().mod(n);

			return v.equals(r);
		},

		/**
		* Serialize a signature into DER format.
		*
		* Takes two BigIntegers representing r and s and returns a byte array.
		*/
		serializeSig: function (r, s) {
			var rBa = r.toByteArraySigned();
			var sBa = s.toByteArraySigned();

			var sequence = [];
			sequence.push(0x02); // INTEGER
			sequence.push(rBa.length);
			sequence = sequence.concat(rBa);

			sequence.push(0x02); // INTEGER
			sequence.push(sBa.length);
			sequence = sequence.concat(sBa);

			sequence.unshift(sequence.length);
			sequence.unshift(0x30); // SEQUENCE

			return sequence;
		},

		/**
		* Parses a byte array containing a DER-encoded signature.
		*
		* This function will return an object of the form:
		*
		* {
		*   r: BigInteger,
		*   s: BigInteger
		* }
		*/
		parseSig: function (sig) {
			var cursor;
			if (sig[0] != 0x30)
				throw new Error("Signature not a valid DERSequence");

			cursor = 2;
			if (sig[cursor] != 0x02)
				throw new Error("First element in signature must be a DERInteger"); ;
			var rBa = sig.slice(cursor + 2, cursor + 2 + sig[cursor + 1]);

			cursor += 2 + sig[cursor + 1];
			if (sig[cursor] != 0x02)
				throw new Error("Second element in signature must be a DERInteger");
			var sBa = sig.slice(cursor + 2, cursor + 2 + sig[cursor + 1]);

			cursor += 2 + sig[cursor + 1];

			//if (cursor != sig.length)
			//	throw new Error("Extra bytes in signature");

			var r = BigInteger.fromByteArrayUnsigned(rBa);
			var s = BigInteger.fromByteArrayUnsigned(sBa);

			return { r: r, s: s };
		},

		parseSigCompact: function (sig) {
			if (sig.length !== 65) {
				throw "Signature has the wrong length";
			}

			// Signature is prefixed with a type byte storing three bits of
			// information.
			var i = sig[0] - 27;
			if (i < 0 || i > 7) {
				throw "Invalid signature type";
			}

			var n = ecparams.getN();
			var r = BigInteger.fromByteArrayUnsigned(sig.slice(1, 33)).mod(n);
			var s = BigInteger.fromByteArrayUnsigned(sig.slice(33, 65)).mod(n);

			return { r: r, s: s, i: i };
		},

		/**
		* Recover a public key from a signature.
		*
		* See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
		* Key Recovery Operation".
		*
		* http://www.secg.org/download/aid-780/sec1-v2.pdf
		*/
		recoverPubKey: function (r, s, hash, i) {
			// The recovery parameter i has two bits.
			i = i & 3;

			// The less significant bit specifies whether the y coordinate
			// of the compressed point is even or not.
			var isYEven = i & 1;

			// The more significant bit specifies whether we should use the
			// first or second candidate key.
			var isSecondKey = i >> 1;

			var n = ecparams.getN();
			var G = ecparams.getG();
			var curve = ecparams.getCurve();
			var p = curve.getQ();
			var a = curve.getA().toBigInteger();
			var b = curve.getB().toBigInteger();

			// We precalculate (p + 1) / 4 where p is if the field order
			if (!P_OVER_FOUR) {
				P_OVER_FOUR = p.add(BigInteger.ONE).divide(BigInteger.valueOf(4));
			}

			// 1.1 Compute x
			var x = isSecondKey ? r.add(n) : r;

			// 1.3 Convert x to point
			var alpha = x.multiply(x).multiply(x).add(a.multiply(x)).add(b).mod(p);
			var beta = alpha.modPow(P_OVER_FOUR, p);

			var xorOdd = beta.isEven() ? (i % 2) : ((i + 1) % 2);
			// If beta is even, but y isn't or vice versa, then convert it,
			// otherwise we're done and y == beta.
			var y = (beta.isEven() ? !isYEven : isYEven) ? beta : p.subtract(beta);

			// 1.4 Check that nR is at infinity
			var R = new EllipticCurve.PointFp(curve,
                            curve.fromBigInteger(x),
                            curve.fromBigInteger(y));
			R.validate();

			// 1.5 Compute e from M
			var e = BigInteger.fromByteArrayUnsigned(hash);
			var eNeg = BigInteger.ZERO.subtract(e).mod(n);

			// 1.6 Compute Q = r^-1 (sR - eG)
			var rInv = r.modInverse(n);
			var Q = implShamirsTrick(R, s, G, eNeg).multiply(rInv);

			Q.validate();
			if (!ECDSA.verifyRaw(e, r, s, Q)) {
				throw "Pubkey recovery unsuccessful";
			}

			var pubKey = new Bitcoin.ECKey();
			pubKey.pub = Q;
			return pubKey;
		},

		/**
		* Calculate pubkey extraction parameter.
		*
		* When extracting a pubkey from a signature, we have to
		* distinguish four different cases. Rather than putting this
		* burden on the verifier, Bitcoin includes a 2-bit value with the
		* signature.
		*
		* This function simply tries all four cases and returns the value
		* that resulted in a successful pubkey recovery.
		*/
		calcPubkeyRecoveryParam: function (address, r, s, hash) {
			for (var i = 0; i < 4; i++) {
				try {
					var pubkey = Bitcoin.ECDSA.recoverPubKey(r, s, hash, i);
					if (pubkey.getBitcoinAddress().toString() == address) {
						return i;
					}
				} catch (e) { }
			}
			throw "Unable to find valid recovery factor";
		}
	};

	return ECDSA;
})();

Bitcoin.KeyPool = (function () {
	var KeyPool = function () {
		this.keyArray = [];

		this.push = function (item) {
			if (item == null || item.priv == null) return;
			var doAdd = true;
			// prevent duplicates from being added to the array
			for (var index in this.keyArray) {
				var currentItem = this.keyArray[index];
				if (currentItem != null && currentItem.priv != null && item.getBitcoinAddress() == currentItem.getBitcoinAddress()) {
					doAdd = false;
					break;
				}
			}
			if (doAdd) this.keyArray.push(item);
		};

		this.reset = function () {
			this.keyArray = [];
		};

		this.getArray = function () {
			// copy array
			return this.keyArray.slice(0);
		};

		this.setArray = function (ka) {
			this.keyArray = ka;
		};

		this.length = function () {
			return this.keyArray.length;
		};

		this.toString = function () {
			var keyPoolString = "# = " + this.length() + "\n";
			var pool = this.getArray();
			for (var index in pool) {
				var item = pool[index];
				if (Bitcoin.Util.hasMethods(item, 'getBitcoinAddress', 'toString')) {
					if (item != null) {
						keyPoolString += "\"" + item.getBitcoinAddress() + "\"" + ", \"" + item.toString("wif") + "\"\n";
					}
				}
			}

			return keyPoolString;
		};

		return this;
	};

	return new KeyPool();
})();

Bitcoin.Bip38Key = (function () {
	var Bip38 = function (address, encryptedKey) {
		this.address = address;
		this.priv = encryptedKey;
	};

	Bip38.prototype.getBitcoinAddress = function () {
		return this.address;
	};

	Bip38.prototype.toString = function () {
		return this.priv;
	};

	return Bip38;
})();

//https://raw.github.com/pointbiz/bitcoinjs-lib/9b2f94a028a7bc9bed94e0722563e9ff1d8e8db8/src/eckey.js
Bitcoin.ECKey = (function () {
	var ECDSA = Bitcoin.ECDSA;
	var KeyPool = Bitcoin.KeyPool;
	var ecparams = EllipticCurve.getSECCurveByName("secp256k1");

	var ECKey = function (input) {
		if (!input) {
			// Generate new key
			var n = ecparams.getN();
			this.priv = ECDSA.getBigRandom(n);
		} else if (input instanceof BigInteger) {
			// Input is a private key value
			this.priv = input;
		} else if (Bitcoin.Util.isArray(input)) {
			// Prepend zero byte to prevent interpretation as negative integer
			this.priv = BigInteger.fromByteArrayUnsigned(input);
		} else if ("string" == typeof input) {
			var bytes = null;
			try{
				if (ECKey.isWalletImportFormat(input)) {
					bytes = ECKey.decodeWalletImportFormat(input);
				} else if (ECKey.isCompressedWalletImportFormat(input)) {
					bytes = ECKey.decodeCompressedWalletImportFormat(input);
					this.compressed = true;
				} else if (ECKey.isMiniFormat(input)) {
					bytes = Crypto.SHA256(input, { asBytes: true });
				} else if (ECKey.isHexFormat(input)) {
					bytes = Crypto.util.hexToBytes(input);
				} else if (ECKey.isBase64Format(input)) {
					bytes = Crypto.util.base64ToBytes(input);
				}
			} catch (exc1) {
				this.setError(exc1);
			}

			if (ECKey.isBase6Format(input)) {
				this.priv = new BigInteger(input, 6);
			} else if (bytes == null || bytes.length != 32) {
				this.priv = null;
			} else {
				// Prepend zero byte to prevent interpretation as negative integer
				this.priv = BigInteger.fromByteArrayUnsigned(bytes);
			}
		}

		this.compressed = (this.compressed == undefined) ? !!ECKey.compressByDefault : this.compressed;
		try {
			// check not zero
			if (this.priv != null && BigInteger.ZERO.compareTo(this.priv) == 0) this.setError("Error: BigInteger equal to zero.");
			// valid range [0x1, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140])
			var hexKeyRangeLimit = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140";
			var rangeLimitBytes = Crypto.util.hexToBytes(hexKeyRangeLimit);
			var limitBigInt = BigInteger.fromByteArrayUnsigned(rangeLimitBytes);
			if (this.priv != null && limitBigInt.compareTo(this.priv) < 0) this.setError("Error: BigInteger outside of curve range.")

			if (this.priv != null) {
				KeyPool.push(this);
			}
		} catch (exc2) {
			this.setError(exc2);
		}
	};

	ECKey.privateKeyPrefix = 0x80; // mainnet 0x80    testnet 0xEF

	/**
	* Whether public keys should be returned compressed by default.
	*/
	ECKey.compressByDefault = false;

	/**
	* Set whether the public key should be returned compressed or not.
	*/
	ECKey.prototype.setError = function (err) {
		this.error = err;
		this.priv = null;
		return this;
	};

	/**
	* Set whether the public key should be returned compressed or not.
	*/
	ECKey.prototype.setCompressed = function (v) {
		this.compressed = !!v;
		if (this.pubPoint) this.pubPoint.compressed = this.compressed;
		return this;
	};

	/*
	* Return public key as a byte array in DER encoding
	*/
	ECKey.prototype.getPub = function () {
		if (this.compressed) {
			if (this.pubComp) return this.pubComp;
			return this.pubComp = this.getPubPoint().getEncoded(1);
		} else {
			if (this.pubUncomp) return this.pubUncomp;
			return this.pubUncomp = this.getPubPoint().getEncoded(0);
		}
	};

	/**
	* Return public point as ECPoint object.
	*/
	ECKey.prototype.getPubPoint = function () {
		if (!this.pubPoint) {
			this.pubPoint = ecparams.getG().multiply(this.priv);
			this.pubPoint.compressed = this.compressed;
		}
		return this.pubPoint;
	};

	ECKey.prototype.getPubKeyHex = function () {
		if (this.compressed) {
			if (this.pubKeyHexComp) return this.pubKeyHexComp;
			return this.pubKeyHexComp = Crypto.util.bytesToHex(this.getPub()).toString().toUpperCase();
		} else {
			if (this.pubKeyHexUncomp) return this.pubKeyHexUncomp;
			return this.pubKeyHexUncomp = Crypto.util.bytesToHex(this.getPub()).toString().toUpperCase();
		}
	};

	/**
	* Get the pubKeyHash for this key.
	*
	* This is calculated as RIPE160(SHA256([encoded pubkey])) and returned as
	* a byte array.
	*/
	ECKey.prototype.getPubKeyHash = function () {
		if (this.compressed) {
			if (this.pubKeyHashComp) return this.pubKeyHashComp;
			return this.pubKeyHashComp = Bitcoin.Util.sha256ripe160(this.getPub());
		} else {
			if (this.pubKeyHashUncomp) return this.pubKeyHashUncomp;
			return this.pubKeyHashUncomp = Bitcoin.Util.sha256ripe160(this.getPub());
		}
	};

	ECKey.prototype.getBitcoinAddress = function () {
		var hash = this.getPubKeyHash();
		var addr = new Bitcoin.Address(hash);
		return addr.toString();
	};

	/*
	* Takes a public point as a hex string or byte array
	*/
	ECKey.prototype.setPub = function (pub) {
		// byte array
		if (Bitcoin.Util.isArray(pub)) {
			pub = Crypto.util.bytesToHex(pub).toString().toUpperCase();
		}
		var ecPoint = ecparams.getCurve().decodePointHex(pub);
		this.setCompressed(ecPoint.compressed);
		this.pubPoint = ecPoint;
		return this;
	};

	// Sipa Private Key Wallet Import Format
	ECKey.prototype.getBitcoinWalletImportFormat = function () {
		var bytes = this.getBitcoinPrivateKeyByteArray();
		if (bytes == null) return "";
		bytes.unshift(ECKey.privateKeyPrefix); // prepend 0x80 byte
		if (this.compressed) bytes.push(0x01); // append 0x01 byte for compressed format
		var checksum = Crypto.SHA256(Crypto.SHA256(bytes, { asBytes: true }), { asBytes: true });
		bytes = bytes.concat(checksum.slice(0, 4));
		var privWif = Bitcoin.Base58.encode(bytes);
		return privWif;
	};

	// Private Key Hex Format
	ECKey.prototype.getBitcoinHexFormat = function () {
		return Crypto.util.bytesToHex(this.getBitcoinPrivateKeyByteArray()).toString().toUpperCase();
	};

	// Private Key Base64 Format
	ECKey.prototype.getBitcoinBase64Format = function () {
		return Crypto.util.bytesToBase64(this.getBitcoinPrivateKeyByteArray());
	};

	ECKey.prototype.getBitcoinPrivateKeyByteArray = function () {
		if (this.priv == null) return null;
		// Get a copy of private key as a byte array
		var bytes = this.priv.toByteArrayUnsigned();
		// zero pad if private key is less than 32 bytes
		while (bytes.length < 32) bytes.unshift(0x00);
		return bytes;
	};

	ECKey.prototype.toString = function (format) {
		format = format || "";
		if (format.toString().toLowerCase() == "base64" || format.toString().toLowerCase() == "b64") {
			return this.getBitcoinBase64Format();
		}
		// Wallet Import Format
		else if (format.toString().toLowerCase() == "wif") {
			return this.getBitcoinWalletImportFormat();
		}
		else {
			return this.getBitcoinHexFormat();
		}
	};

	ECKey.prototype.sign = function (hash) {
		return ECDSA.sign(hash, this.priv);
	};

	ECKey.prototype.verify = function (hash, sig) {
		return ECDSA.verify(hash, sig, this.getPub());
	};

	/**
	* Parse a wallet import format private key contained in a string.
	*/
	ECKey.decodeWalletImportFormat = function (privStr) {
		var bytes = Bitcoin.Base58.decode(privStr);
		var hash = bytes.slice(0, 33);
		var checksum = Crypto.SHA256(Crypto.SHA256(hash, { asBytes: true }), { asBytes: true });
		if (checksum[0] != bytes[33] ||
					checksum[1] != bytes[34] ||
					checksum[2] != bytes[35] ||
					checksum[3] != bytes[36]) {
			throw "Checksum validation failed!";
		}
		var version = hash.shift();
		if (version != ECKey.privateKeyPrefix) {
			throw "Version " + version + " not supported!";
		}
		return hash;
	};

	/**
	* Parse a compressed wallet import format private key contained in a string.
	*/
	ECKey.decodeCompressedWalletImportFormat = function (privStr) {
		var bytes = Bitcoin.Base58.decode(privStr);
		var hash = bytes.slice(0, 34);
		var checksum = Crypto.SHA256(Crypto.SHA256(hash, { asBytes: true }), { asBytes: true });
		if (checksum[0] != bytes[34] ||
					checksum[1] != bytes[35] ||
					checksum[2] != bytes[36] ||
					checksum[3] != bytes[37]) {
			throw "Checksum validation failed!";
		}
		var version = hash.shift();
		if (version != ECKey.privateKeyPrefix) {
			throw "Version " + version + " not supported!";
		}
		hash.pop();
		return hash;
	};

	// 64 characters [0-9A-F]
	ECKey.isHexFormat = function (key) {
		key = key.toString();
		return /^[A-Fa-f0-9]{64}$/.test(key);
	};

	// 51 characters base58, always starts with a '5'
	ECKey.isWalletImportFormat = function (key) {
		key = key.toString();
		return (ECKey.privateKeyPrefix == 0x80) ?
							(/^5[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50}$/.test(key)) :
							(/^9[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50}$/.test(key));
	};

	// 52 characters base58
	ECKey.isCompressedWalletImportFormat = function (key) {
		key = key.toString();
		return (ECKey.privateKeyPrefix == 0x80) ?
							(/^[LK][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(key)) :
							(/^c[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(key));
	};

	// 44 characters
	ECKey.isBase64Format = function (key) {
		key = key.toString();
		return (/^[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=+\/]{44}$/.test(key));
	};

	// 99 characters, 1=1, if using dice convert 6 to 0
	ECKey.isBase6Format = function (key) {
		key = key.toString();
		return (/^[012345]{99}$/.test(key));
	};

	// 22, 26 or 30 characters, always starts with an 'S'
	ECKey.isMiniFormat = function (key) {
		key = key.toString();
		var validChars22 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{21}$/.test(key);
		var validChars26 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{25}$/.test(key);
		var validChars30 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{29}$/.test(key);
		var testBytes = Crypto.SHA256(key + "?", { asBytes: true });

		return ((testBytes[0] === 0x00 || testBytes[0] === 0x01) && (validChars22 || validChars26 || validChars30));
	};

	return ECKey;
})();

Bitcoin.Util = {
	/**
	* Cross-browser compatibility version of Array.isArray.
	*/
	isArray: Array.isArray || function (o) {
		return Object.prototype.toString.call(o) === '[object Array]';
	},
	/**
	* Create an array of a certain length filled with a specific value.
	*/
	makeFilledArray: function (len, val) {
		var array = [];
		var i = 0;
		while (i < len) {
			array[i++] = val;
		}
		return array;
	},
	/**
	* Turn an integer into a "var_int".
	*
	* "var_int" is a variable length integer used by Bitcoin's binary format.
	*
	* Returns a byte array.
	*/
	numToVarInt: function (i) {
		if (i < 0xfd) {
			// unsigned char
			return [i];
		} else if (i <= 1 << 16) {
			// unsigned short (LE)
			return [0xfd, i >>> 8, i & 255];
		} else if (i <= 1 << 32) {
			// unsigned int (LE)
			return [0xfe].concat(Crypto.util.wordsToBytes([i]));
		} else {
			// unsigned long long (LE)
			return [0xff].concat(Crypto.util.wordsToBytes([i >>> 32, i]));
		}
	},
	/**
	* Parse a Bitcoin value byte array, returning a BigInteger.
	*/
	valueToBigInt: function (valueBuffer) {
		if (valueBuffer instanceof BigInteger) return valueBuffer;

		// Prepend zero byte to prevent interpretation as negative integer
		return BigInteger.fromByteArrayUnsigned(valueBuffer);
	},
	/**
	* Format a Bitcoin value as a string.
	*
	* Takes a BigInteger or byte-array and returns that amount of Bitcoins in a
	* nice standard formatting.
	*
	* Examples:
	* 12.3555
	* 0.1234
	* 900.99998888
	* 34.00
	*/
	formatValue: function (valueBuffer) {
		var value = this.valueToBigInt(valueBuffer).toString();
		var integerPart = value.length > 8 ? value.substr(0, value.length - 8) : '0';
		var decimalPart = value.length > 8 ? value.substr(value.length - 8) : value;
		while (decimalPart.length < 8) decimalPart = "0" + decimalPart;
		decimalPart = decimalPart.replace(/0*$/, '');
		while (decimalPart.length < 2) decimalPart += "0";
		return integerPart + "." + decimalPart;
	},
	/**
	* Parse a floating point string as a Bitcoin value.
	*
	* Keep in mind that parsing user input is messy. You should always display
	* the parsed value back to the user to make sure we understood his input
	* correctly.
	*/
	parseValue: function (valueString) {
		// TODO: Detect other number formats (e.g. comma as decimal separator)
		var valueComp = valueString.split('.');
		var integralPart = valueComp[0];
		var fractionalPart = valueComp[1] || "0";
		while (fractionalPart.length < 8) fractionalPart += "0";
		fractionalPart = fractionalPart.replace(/^0+/g, '');
		var value = BigInteger.valueOf(parseInt(integralPart));
		value = value.multiply(BigInteger.valueOf(100000000));
		value = value.add(BigInteger.valueOf(parseInt(fractionalPart)));
		return value;
	},
	/**
	* Calculate RIPEMD160(SHA256(data)).
	*
	* Takes an arbitrary byte array as inputs and returns the hash as a byte
	* array.
	*/
	sha256ripe160: function (data) {
		return Crypto.RIPEMD160(Crypto.SHA256(data, { asBytes: true }), { asBytes: true });
	},
	// double sha256
	dsha256: function (data) {
		return Crypto.SHA256(Crypto.SHA256(data, { asBytes: true }), { asBytes: true });
	},
	// duck typing method
	hasMethods: function(obj /*, method list as strings */){
		var i = 1, methodName;
		while((methodName = arguments[i++])){
			if(typeof obj[methodName] != 'function') {
				return false;
			}
		}
		return true;
	}
};

(function () {

	var MAX_VALUE = 2147483647;
	var workerUrl = null;

	//function scrypt(byte[] passwd, byte[] salt, int N, int r, int p, int dkLen)
	/*
	* N = Cpu cost
	* r = Memory cost
	* p = parallelization cost
	*
	*/
	window.Crypto_scrypt = function (passwd, salt, N, r, p, dkLen, callback) {
		if (N == 0 || (N & (N - 1)) != 0) throw Error("N must be > 0 and a power of 2");

		if (N > MAX_VALUE / 128 / r) throw Error("Parameter N is too large");
		if (r > MAX_VALUE / 128 / p) throw Error("Parameter r is too large");

		var PBKDF2_opts = { iterations: 1, hasher: Crypto.SHA256, asBytes: true };

		var B = Crypto.PBKDF2(passwd, salt, p * 128 * r, PBKDF2_opts);

		try {
			var i = 0;
			var worksDone = 0;
			var makeWorker = function () {
				if (!workerUrl) {
					var code = '(' + scryptCore.toString() + ')()';
					var blob;
					try {
						blob = new Blob([code], { type: "text/javascript" });
					} catch (e) {
						window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
						blob = new BlobBuilder();
						blob.append(code);
						blob = blob.getBlob("text/javascript");
					}
					workerUrl = URL.createObjectURL(blob);
				}
				var worker = new Worker(workerUrl);
				worker.onmessage = function (event) {
					var Bi = event.data[0], Bslice = event.data[1];
					worksDone++;

					if (i < p) {
						worker.postMessage([N, r, p, B, i++]);
					}

					var length = Bslice.length, destPos = Bi * 128 * r, srcPos = 0;
					while (length--) {
						B[destPos++] = Bslice[srcPos++];
					}

					if (worksDone == p) {
						callback(Crypto.PBKDF2(passwd, B, dkLen, PBKDF2_opts));
					}
				};
				return worker;
			};
			var workers = [makeWorker(), makeWorker()];
			workers[0].postMessage([N, r, p, B, i++]);
			if (p > 1) {
				workers[1].postMessage([N, r, p, B, i++]);
			}
		} catch (e) {
			window.setTimeout(function () {
				scryptCore();
				callback(Crypto.PBKDF2(passwd, B, dkLen, PBKDF2_opts));
			}, 0);
		}

		// using this function to enclose everything needed to create a worker (but also invokable directly for synchronous use)
		function scryptCore() {
			var XY = [], V = [];

			if (typeof B === 'undefined') {
				onmessage = function (event) {
					var data = event.data;
					var N = data[0], r = data[1], p = data[2], B = data[3], i = data[4];

					var Bslice = [];
					arraycopy32(B, i * 128 * r, Bslice, 0, 128 * r);
					smix(Bslice, 0, r, N, V, XY);

					postMessage([i, Bslice]);
				};
			} else {
				for (var i = 0; i < p; i++) {
					smix(B, i * 128 * r, r, N, V, XY);
				}
			}

			function smix(B, Bi, r, N, V, XY) {
				var Xi = 0;
				var Yi = 128 * r;
				var i;

				arraycopy32(B, Bi, XY, Xi, Yi);

				for (i = 0; i < N; i++) {
					arraycopy32(XY, Xi, V, i * Yi, Yi);
					blockmix_salsa8(XY, Xi, Yi, r);
				}

				for (i = 0; i < N; i++) {
					var j = integerify(XY, Xi, r) & (N - 1);
					blockxor(V, j * Yi, XY, Xi, Yi);
					blockmix_salsa8(XY, Xi, Yi, r);
				}

				arraycopy32(XY, Xi, B, Bi, Yi);
			}

			function blockmix_salsa8(BY, Bi, Yi, r) {
				var X = [];
				var i;

				arraycopy32(BY, Bi + (2 * r - 1) * 64, X, 0, 64);

				for (i = 0; i < 2 * r; i++) {
					blockxor(BY, i * 64, X, 0, 64);
					salsa20_8(X);
					arraycopy32(X, 0, BY, Yi + (i * 64), 64);
				}

				for (i = 0; i < r; i++) {
					arraycopy32(BY, Yi + (i * 2) * 64, BY, Bi + (i * 64), 64);
				}

				for (i = 0; i < r; i++) {
					arraycopy32(BY, Yi + (i * 2 + 1) * 64, BY, Bi + (i + r) * 64, 64);
				}
			}

			function R(a, b) {
				return (a << b) | (a >>> (32 - b));
			}

			function salsa20_8(B) {
				var B32 = new Array(32);
				var x = new Array(32);
				var i;

				for (i = 0; i < 16; i++) {
					B32[i] = (B[i * 4 + 0] & 0xff) << 0;
					B32[i] |= (B[i * 4 + 1] & 0xff) << 8;
					B32[i] |= (B[i * 4 + 2] & 0xff) << 16;
					B32[i] |= (B[i * 4 + 3] & 0xff) << 24;
				}

				arraycopy(B32, 0, x, 0, 16);

				for (i = 8; i > 0; i -= 2) {
					x[4] ^= R(x[0] + x[12], 7); x[8] ^= R(x[4] + x[0], 9);
					x[12] ^= R(x[8] + x[4], 13); x[0] ^= R(x[12] + x[8], 18);
					x[9] ^= R(x[5] + x[1], 7); x[13] ^= R(x[9] + x[5], 9);
					x[1] ^= R(x[13] + x[9], 13); x[5] ^= R(x[1] + x[13], 18);
					x[14] ^= R(x[10] + x[6], 7); x[2] ^= R(x[14] + x[10], 9);
					x[6] ^= R(x[2] + x[14], 13); x[10] ^= R(x[6] + x[2], 18);
					x[3] ^= R(x[15] + x[11], 7); x[7] ^= R(x[3] + x[15], 9);
					x[11] ^= R(x[7] + x[3], 13); x[15] ^= R(x[11] + x[7], 18);
					x[1] ^= R(x[0] + x[3], 7); x[2] ^= R(x[1] + x[0], 9);
					x[3] ^= R(x[2] + x[1], 13); x[0] ^= R(x[3] + x[2], 18);
					x[6] ^= R(x[5] + x[4], 7); x[7] ^= R(x[6] + x[5], 9);
					x[4] ^= R(x[7] + x[6], 13); x[5] ^= R(x[4] + x[7], 18);
					x[11] ^= R(x[10] + x[9], 7); x[8] ^= R(x[11] + x[10], 9);
					x[9] ^= R(x[8] + x[11], 13); x[10] ^= R(x[9] + x[8], 18);
					x[12] ^= R(x[15] + x[14], 7); x[13] ^= R(x[12] + x[15], 9);
					x[14] ^= R(x[13] + x[12], 13); x[15] ^= R(x[14] + x[13], 18);
				}

				for (i = 0; i < 16; ++i) B32[i] = x[i] + B32[i];

				for (i = 0; i < 16; i++) {
					var bi = i * 4;
					B[bi + 0] = (B32[i] >> 0 & 0xff);
					B[bi + 1] = (B32[i] >> 8 & 0xff);
					B[bi + 2] = (B32[i] >> 16 & 0xff);
					B[bi + 3] = (B32[i] >> 24 & 0xff);
				}
			}

			function blockxor(S, Si, D, Di, len) {
				var i = len >> 6;
				while (i--) {
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
					D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
				}
			}

			function integerify(B, bi, r) {
				var n;

				bi += (2 * r - 1) * 64;

				n = (B[bi + 0] & 0xff) << 0;
				n |= (B[bi + 1] & 0xff) << 8;
				n |= (B[bi + 2] & 0xff) << 16;
				n |= (B[bi + 3] & 0xff) << 24;

				return n;
			}

			function arraycopy(src, srcPos, dest, destPos, length) {
				while (length--) {
					dest[destPos++] = src[srcPos++];
				}
			}

			function arraycopy32(src, srcPos, dest, destPos, length) {
				var i = length >> 5;
				while (i--) {
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];

					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];

					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];

					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
					dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
				}
			}
		} // scryptCore
	}; // window.Crypto_scrypt
})();

var ninja = { wallets: {} };

ninja.privateKey = {
	isPrivateKey: function (key) {
		return (
					Bitcoin.ECKey.isWalletImportFormat(key) ||
					Bitcoin.ECKey.isCompressedWalletImportFormat(key) ||
					Bitcoin.ECKey.isHexFormat(key) ||
					Bitcoin.ECKey.isBase64Format(key) ||
					Bitcoin.ECKey.isMiniFormat(key)
				);
	},
	getECKeyFromAdding: function (privKey1, privKey2) {
		var n = EllipticCurve.getSECCurveByName("secp256k1").getN();
		var ecKey1 = new Bitcoin.ECKey(privKey1);
		var ecKey2 = new Bitcoin.ECKey(privKey2);
		// if both keys are the same return null
		if (ecKey1.getBitcoinHexFormat() == ecKey2.getBitcoinHexFormat()) return null;
		if (ecKey1 == null || ecKey2 == null) return null;
		var combinedPrivateKey = new Bitcoin.ECKey(ecKey1.priv.add(ecKey2.priv).mod(n));
		// compressed when both keys are compressed
		if (ecKey1.compressed && ecKey2.compressed) combinedPrivateKey.setCompressed(true);
		return combinedPrivateKey;
	},
	getECKeyFromMultiplying: function (privKey1, privKey2) {
		var n = EllipticCurve.getSECCurveByName("secp256k1").getN();
		var ecKey1 = new Bitcoin.ECKey(privKey1);
		var ecKey2 = new Bitcoin.ECKey(privKey2);
		// if both keys are the same return null
		if (ecKey1.getBitcoinHexFormat() == ecKey2.getBitcoinHexFormat()) return null;
		if (ecKey1 == null || ecKey2 == null) return null;
		var combinedPrivateKey = new Bitcoin.ECKey(ecKey1.priv.multiply(ecKey2.priv).mod(n));
		// compressed when both keys are compressed
		if (ecKey1.compressed && ecKey2.compressed) combinedPrivateKey.setCompressed(true);
		return combinedPrivateKey;
	},
	// 58 base58 characters starting with 6P
	isBIP38Format: function (key) {
		key = key.toString();
		return (/^6P[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{56}$/.test(key));
	},
	BIP38EncryptedKeyToByteArrayAsync: function (base58Encrypted, passphrase, callback) {
		var hex;
		try {
			hex = Bitcoin.Base58.decode(base58Encrypted);
		} catch (e) {
			return;
		}

		// 43 bytes: 2 bytes prefix, 37 bytes payload, 4 bytes checksum
		if (hex.length != 43) {
			return;
		}
		// first byte is always 0x01
		else if (hex[0] != 0x01) {
			return;
		}

		var expChecksum = hex.slice(-4);
		hex = hex.slice(0, -4);
		var checksum = Bitcoin.Util.dsha256(hex);
		if (checksum[0] != expChecksum[0] || checksum[1] != expChecksum[1] || checksum[2] != expChecksum[2] || checksum[3] != expChecksum[3]) {
			return;
		}

		var isCompPoint = false;
		var isECMult = false;
		var hasLotSeq = false;
		// second byte for non-EC-multiplied key
		if (hex[1] == 0x42) {
			// key should use compression
			if (hex[2] == 0xe0) {
				isCompPoint = true;
			}
			// key should NOT use compression
			else if (hex[2] != 0xc0) {
				return;
			}
		}
		// second byte for EC-multiplied key
		else if (hex[1] == 0x43) {
			isECMult = true;
			isCompPoint = (hex[2] & 0x20) != 0;
			hasLotSeq = (hex[2] & 0x04) != 0;
			if ((hex[2] & 0x24) != hex[2]) {
				return;
			}
		}
		else {
			return;
		}

		var decrypted;
		var AES_opts = { mode: new Crypto.mode.ECB(Crypto.pad.NoPadding), asBytes: true };

		var verifyHashAndReturn = function () {
			var tmpkey = new Bitcoin.ECKey(decrypted); // decrypted using closure
			var base58AddrText = tmpkey.setCompressed(isCompPoint).getBitcoinAddress(); // isCompPoint using closure
			checksum = Bitcoin.Util.dsha256(base58AddrText); // checksum using closure

			if (checksum[0] != hex[3] || checksum[1] != hex[4] || checksum[2] != hex[5] || checksum[3] != hex[6]) {
				return;
			}
			callback(tmpkey.getBitcoinPrivateKeyByteArray()); // callback using closure
		};

		if (!isECMult) {
			var addresshash = hex.slice(3, 7);
			Crypto_scrypt(passphrase, addresshash, 16384, 8, 8, 64, function (derivedBytes) {
				var k = derivedBytes.slice(32, 32 + 32);
				decrypted = Crypto.AES.decrypt(hex.slice(7, 7 + 32), k, AES_opts);
				for (var x = 0; x < 32; x++) decrypted[x] ^= derivedBytes[x];
				verifyHashAndReturn(); //TODO: pass in 'decrypted' as a param
			});
		}
		else {
			var ownerentropy = hex.slice(7, 7 + 8);
			var ownersalt = !hasLotSeq ? ownerentropy : ownerentropy.slice(0, 4);
			Crypto_scrypt(passphrase, ownersalt, 16384, 8, 8, 32, function (prefactorA) {
				var passfactor;
				if (!hasLotSeq) { // hasLotSeq using closure
					passfactor = prefactorA;
				} else {
					var prefactorB = prefactorA.concat(ownerentropy); // ownerentropy using closure
					passfactor = Bitcoin.Util.dsha256(prefactorB);
				}
				// remove this ECKey from the pool (because user does not see it)
				var userKeyPool = Bitcoin.KeyPool.getArray();
				var kp = new Bitcoin.ECKey(passfactor);
				var passpoint = kp.setCompressed(true).getPub();
				Bitcoin.KeyPool.setArray(userKeyPool);
				var encryptedpart2 = hex.slice(23, 23 + 16);

				var addresshashplusownerentropy = hex.slice(3, 3 + 12);
				Crypto_scrypt(passpoint, addresshashplusownerentropy, 1024, 1, 1, 64, function (derived) {
					var k = derived.slice(32);

					var unencryptedpart2 = Crypto.AES.decrypt(encryptedpart2, k, AES_opts);
					for (var i = 0; i < 16; i++) { unencryptedpart2[i] ^= derived[i + 16]; }

					var encryptedpart1 = hex.slice(15, 15 + 8).concat(unencryptedpart2.slice(0, 0 + 8));
					var unencryptedpart1 = Crypto.AES.decrypt(encryptedpart1, k, AES_opts);
					for (var i = 0; i < 16; i++) { unencryptedpart1[i] ^= derived[i]; }

					var seedb = unencryptedpart1.slice(0, 0 + 16).concat(unencryptedpart2.slice(8, 8 + 8));

					var factorb = Bitcoin.Util.dsha256(seedb);

					var ps = EllipticCurve.getSECCurveByName("secp256k1");
					var privateKey = BigInteger.fromByteArrayUnsigned(passfactor).multiply(BigInteger.fromByteArrayUnsigned(factorb)).remainder(ps.getN());

					decrypted = privateKey.toByteArrayUnsigned();
					verifyHashAndReturn();
				});
			});
		}
	},
	BIP38PrivateKeyToEncryptedKeyAsync: function (base58Key, passphrase, compressed, callback) {
		var privKey = new Bitcoin.ECKey(base58Key);
		var privKeyBytes = privKey.getBitcoinPrivateKeyByteArray();
		var address = privKey.setCompressed(compressed).getBitcoinAddress();

		// compute sha256(sha256(address)) and take first 4 bytes
		var salt = Bitcoin.Util.dsha256(address).slice(0, 4);

		// derive key using scrypt
		var AES_opts = { mode: new Crypto.mode.ECB(Crypto.pad.NoPadding), asBytes: true };

		Crypto_scrypt(passphrase, salt, 16384, 8, 8, 64, function (derivedBytes) {
			for (var i = 0; i < 32; ++i) {
				privKeyBytes[i] ^= derivedBytes[i];
			}

			// 0x01 0x42 + flagbyte + salt + encryptedhalf1 + encryptedhalf2
			var flagByte = compressed ? 0xe0 : 0xc0;
			var encryptedKey = [0x01, 0x42, flagByte].concat(salt);
			encryptedKey = encryptedKey.concat(Crypto.AES.encrypt(privKeyBytes, derivedBytes.slice(32), AES_opts));
			encryptedKey = encryptedKey.concat(Bitcoin.Util.dsha256(encryptedKey).slice(0, 4));
			callback(Bitcoin.Base58.encode(encryptedKey));
		});
	},
	BIP38GenerateIntermediatePointAsync: function (passphrase, lotNum, sequenceNum, callback) {
		var noNumbers = lotNum === null || sequenceNum === null;
		var rng = new SecureRandom();
		var ownerEntropy, ownerSalt;

		if (noNumbers) {
			ownerSalt = ownerEntropy = new Array(8);
			rng.nextBytes(ownerEntropy);
		}
		else {
			// 1) generate 4 random bytes
			ownerSalt = new Array(4);

			rng.nextBytes(ownerSalt);

			// 2)  Encode the lot and sequence numbers as a 4 byte quantity (big-endian):
			// lotnumber * 4096 + sequencenumber. Call these four bytes lotsequence.
			var lotSequence = BigInteger(4096 * lotNum + sequenceNum).toByteArrayUnsigned();

			// 3) Concatenate ownersalt + lotsequence and call this ownerentropy.
			var ownerEntropy = ownerSalt.concat(lotSequence);
		}


		// 4) Derive a key from the passphrase using scrypt
		Crypto_scrypt(passphrase, ownerSalt, 16384, 8, 8, 32, function (prefactor) {
			// Take SHA256(SHA256(prefactor + ownerentropy)) and call this passfactor
			var passfactorBytes = noNumbers ? prefactor : Bitcoin.Util.dsha256(prefactor.concat(ownerEntropy));
			var passfactor = BigInteger.fromByteArrayUnsigned(passfactorBytes);

			// 5) Compute the elliptic curve point G * passfactor, and convert the result to compressed notation (33 bytes)
			var ellipticCurve = EllipticCurve.getSECCurveByName("secp256k1");
			var passpoint = ellipticCurve.getG().multiply(passfactor).getEncoded(1);

			// 6) Convey ownersalt and passpoint to the party generating the keys, along with a checksum to ensure integrity.
			// magic bytes "2C E9 B3 E1 FF 39 E2 51" followed by ownerentropy, and then passpoint
			var magicBytes = [0x2C, 0xE9, 0xB3, 0xE1, 0xFF, 0x39, 0xE2, 0x51];
			if (noNumbers) magicBytes[7] = 0x53;

			var intermediate = magicBytes.concat(ownerEntropy).concat(passpoint);

			// base58check encode
			intermediate = intermediate.concat(Bitcoin.Util.dsha256(intermediate).slice(0, 4));
			callback(Bitcoin.Base58.encode(intermediate));
		});
	},
	BIP38GenerateECAddressAsync: function (intermediate, compressed, callback) {
		// decode IPS
		var x = Bitcoin.Base58.decode(intermediate);
		//if(x.slice(49, 4) !== Bitcoin.Util.dsha256(x.slice(0,49)).slice(0,4)) {
		//	callback({error: 'Invalid intermediate passphrase string'});
		//}
		var noNumbers = (x[7] === 0x53);
		var ownerEntropy = x.slice(8, 8 + 8);
		var passpoint = x.slice(16, 16 + 33);

		// 1) Set flagbyte.
		// set bit 0x20 for compressed key
		// set bit 0x04 if ownerentropy contains a value for lotsequence
		var flagByte = (compressed ? 0x20 : 0x00) | (noNumbers ? 0x00 : 0x04);


		// 2) Generate 24 random bytes, call this seedb.
		var seedB = new Array(24);
		var rng = new SecureRandom();
		rng.nextBytes(seedB);

		// Take SHA256(SHA256(seedb)) to yield 32 bytes, call this factorb.
		var factorB = Bitcoin.Util.dsha256(seedB);

		// 3) ECMultiply passpoint by factorb. Use the resulting EC point as a public key and hash it into a Bitcoin
		// address using either compressed or uncompressed public key methodology (specify which methodology is used
		// inside flagbyte). This is the generated Bitcoin address, call it generatedaddress.
		var ec = EllipticCurve.getSECCurveByName("secp256k1").getCurve();
		var generatedPoint = ec.decodePointHex(ninja.publicKey.getHexFromByteArray(passpoint));
		var generatedBytes = generatedPoint.multiply(BigInteger.fromByteArrayUnsigned(factorB)).getEncoded(compressed);
		var generatedAddress = (new Bitcoin.Address(Bitcoin.Util.sha256ripe160(generatedBytes))).toString();

		// 4) Take the first four bytes of SHA256(SHA256(generatedaddress)) and call it addresshash.
		var addressHash = Bitcoin.Util.dsha256(generatedAddress).slice(0, 4);

		// 5) Now we will encrypt seedb. Derive a second key from passpoint using scrypt
		Crypto_scrypt(passpoint, addressHash.concat(ownerEntropy), 1024, 1, 1, 64, function (derivedBytes) {
			// 6) Do AES256Encrypt(seedb[0...15]] xor derivedhalf1[0...15], derivedhalf2), call the 16-byte result encryptedpart1
			for (var i = 0; i < 16; ++i) {
				seedB[i] ^= derivedBytes[i];
			}
			var AES_opts = { mode: new Crypto.mode.ECB(Crypto.pad.NoPadding), asBytes: true };
			var encryptedPart1 = Crypto.AES.encrypt(seedB.slice(0, 16), derivedBytes.slice(32), AES_opts);

			// 7) Do AES256Encrypt((encryptedpart1[8...15] + seedb[16...23]) xor derivedhalf1[16...31], derivedhalf2), call the 16-byte result encryptedseedb.
			var message2 = encryptedPart1.slice(8, 8 + 8).concat(seedB.slice(16, 16 + 8));
			for (var i = 0; i < 16; ++i) {
				message2[i] ^= derivedBytes[i + 16];
			}
			var encryptedSeedB = Crypto.AES.encrypt(message2, derivedBytes.slice(32), AES_opts);

			// 0x01 0x43 + flagbyte + addresshash + ownerentropy + encryptedpart1[0...7] + encryptedpart2
			var encryptedKey = [0x01, 0x43, flagByte].concat(addressHash).concat(ownerEntropy).concat(encryptedPart1.slice(0, 8)).concat(encryptedSeedB);

			encryptedKey = encryptedKey.concat(Bitcoin.Util.dsha256(encryptedKey).slice(0, 4));
			callback(generatedAddress, Bitcoin.Base58.encode(encryptedKey));
		});
	}
};

ninja.publicKey = {
	isPublicKeyHexFormat: function (key) {
		key = key.toString();
		return ninja.publicKey.isUncompressedPublicKeyHexFormat(key) || ninja.publicKey.isCompressedPublicKeyHexFormat(key);
	},
	// 130 characters [0-9A-F] starts with 04
	isUncompressedPublicKeyHexFormat: function (key) {
		key = key.toString();
		return /^04[A-Fa-f0-9]{128}$/.test(key);
	},
	// 66 characters [0-9A-F] starts with 02 or 03
	isCompressedPublicKeyHexFormat: function (key) {
		key = key.toString();
		return /^0[2-3][A-Fa-f0-9]{64}$/.test(key);
	},
	getBitcoinAddressFromByteArray: function (pubKeyByteArray) {
		var pubKeyHash = Bitcoin.Util.sha256ripe160(pubKeyByteArray);
		var addr = new Bitcoin.Address(pubKeyHash);
		return addr.toString();
	},
	getHexFromByteArray: function (pubKeyByteArray) {
		return Crypto.util.bytesToHex(pubKeyByteArray).toString().toUpperCase();
	},
	getByteArrayFromAdding: function (pubKeyHex1, pubKeyHex2) {
		var ecparams = EllipticCurve.getSECCurveByName("secp256k1");
		var curve = ecparams.getCurve();
		var ecPoint1 = curve.decodePointHex(pubKeyHex1);
		var ecPoint2 = curve.decodePointHex(pubKeyHex2);

		if (ecPoint1.equals(ecPoint2)) return null;
		var compressed = (ecPoint1.compressed && ecPoint2.compressed);
		var pubKey = ecPoint1.add(ecPoint2).getEncoded(compressed);
		return pubKey;
	},
	getByteArrayFromMultiplying: function (pubKeyHex, ecKey) {
		var ecparams = EllipticCurve.getSECCurveByName("secp256k1");
		var ecPoint = ecparams.getCurve().decodePointHex(pubKeyHex);
		var compressed = (ecPoint.compressed && ecKey.compressed);

		ecKey.setCompressed(false);
		if (ecPoint.equals(ecKey.getPubPoint())) {
			return null;
		}
		var bigInt = ecKey.priv;
		var pubKey = ecPoint.multiply(bigInt).getEncoded(compressed);
		return pubKey;
	}
};

function addKeys(a, b)
{
	console.log("starting");
	try
	{
		var pubKeyHex = (ninja.publicKey.isPublicKeyHexFormat(a)) ? a : b;
		var ecKey = (ninja.privateKey.isPrivateKey(a)) ? new Bitcoin.ECKey(a) : new Bitcoin.ECKey(b);
		var pubKeyCombined = ninja.publicKey.getByteArrayFromAdding(pubKeyHex, ecKey.getPubKeyHex());

		if (pubKeyCombined != null) {
			bitcoinAddress = ninja.publicKey.getBitcoinAddressFromByteArray(pubKeyCombined);
			publicKeyHex = ninja.publicKey.getHexFromByteArray(pubKeyCombined);
		}

	} catch (e) {
        console.log("ERROER" + e);
		return "";
		
	}
    console.log("bitcoinAddress: " + bitcoinAddress);
	return bitcoinAddress;
}