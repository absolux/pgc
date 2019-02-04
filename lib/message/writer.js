
'use strict'

const HEADER_POSITION = 0
const LENGTH_POSITION = 1
const OFFSET_POSITION = 5

class MessageWriter {
  constructor (size = 1024) {
    this._buffer = Buffer.alloc(size)
    this._offset = OFFSET_POSITION
  }

  /**
   * 
   * @param {number} value 
   * @public
   */
  writeInt16 (value) {
    this._ensure(2)
    this._buffer.writeInt16BE(value, this._offset)
    this._offset += 2
    return this
  }

  /**
   * 
   * @param {number} value 
   * @public
   */
  writeInt32 (value) {
    this._ensure(4)
    this._buffer.writeInt32BE(value, this._offset)
    this._offset += 4
    return this
  }

  /**
   * 
   * @param {string} value 
   * @param {string} encoding 
   * @public
   */
  writeString (value, encoding = 'utf8') {
    let length = Buffer.byteLength(value, encoding)

    this._ensure(length)
    this._buffer.write(value, this._offset)
    this._offset += length
    return this
  }

  /**
   * 
   * @param {string} value 
   * @param {string} encoding 
   * @public
   */
  writeCString (value, encoding = 'utf8') {
    this.writeString(value, encoding)
    this._buffer.writeUInt8(this._offset++, 0)
    return this
  }

  /**
   * 
   * @param {Buffer} buffer 
   */
  append (buffer) {
    this._ensure(buffer.length)
    buffer.copy(this._buffer, this._offset)
    this._offset += buffer.length
    return this
  }

  /**
   * 
   * @param {number} code 
   * @public
   */
  flush (code) {
    this._writeHeader(code)

    let start = code ? HEADER_POSITION : LENGTH_POSITION
    let end = this._offset

    // reset
    this._offset = OFFSET_POSITION

    return this._buffer.slice(start, end)
  }

  /**
   * Resize internal buffer if not enough size left.
   * 
   * @param {number} size 
   * @private
   */
  _ensure (size) {
    let length = this._buffer.length

    if ((length - this._offset) <= size) {
      let oldBuffer = this._buffer
      let newSize = length * (length >> 1) + size

      oldBuffer.copy(this._buffer = Buffer.alloc(newSize))
    }
  }

  /**
   * Write the packet header.
   * 
   * @param {number} code 
   * @private
   */
  _writeHeader (code) {
    if (code) this._buffer.writeUInt8(HEADER_POSITION, code)

    this._buffer.writeUInt32BE(this._offset - LENGTH_POSITION, LENGTH_POSITION)
  }
}

// export
module.exports = {
  MessageWriter
}
