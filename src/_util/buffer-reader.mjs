
export class BufferReader {
	/**
	 * 
	 * @param {Buffer} source 
	 */
	constructor (source) {
		this._buffer = source
		this._offset = 0
	}

	/**
	 * 
	 * @param {number} length 
	 * @public
	 */
	readBytes (length) {
		return this._buffer.slice(this._offset, (this._offset += length))
	}

	/**
	 * 
	 * @public
	 */
	readInt16 () {
		return this._buffer.readInt16BE((this._offset += 2) - 2)
	}

	/**
	 * 
	 * @public
	 */
	readInt32 () {
		return this._buffer.readInt32BE((this._offset += 4) - 4)
	}

	/**
	 * 
	 * @param {number} length 
	 * @param {string} encoding 
	 * @public
	 */
	readString (length, encoding = 'utf8') {
		return this._buffer.toString(encoding, this._offset, (this._offset += length))
	}

	/**
	 * 
	 * @param {string} encoding 
	 * @public
	 */
	readCString (encoding = 'utf8') {
		let end = this._buffer.indexOf(0, this._offset) + 1 // plus null terminator

		return this._buffer.toString(encoding, this._offset, (this._offset = end) - 1)
	}
}
