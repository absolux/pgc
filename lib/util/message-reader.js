
'use strict'

const CODE_SIZE = 1
const LENGTH_SIZE = 4
const HEADER_SIZE = 5


class MessageReader {
  constructor () {
    this._buffer = Buffer.alloc(0)
    this._offset = 0
  }

  /**
   * Append the received chunk
   * 
   * @param {Buffer} chunk 
   * @public
   */
  append (chunk) {
    let remaining = this._buffer.length - this._offset

    if (! remaining) {
      this._buffer = chunk
      this._offset = 0
      return this
    }

    let oldBuffer = this._buffer

    this._buffer = Buffer.alloc(remaining + chunk.length)
    oldBuffer.copy(this._buffer, 0, this._offset)
    chunk.copy(this._buffer, remaining)
    this._offset = 0

    return this
  }

  /**
   * Read a packet from the buffer
   * 
   * @public
   */
  read () {
    let remaining = this._buffer.length - this._offset

    if (remaining < HEADER_SIZE) return

    let length = this._readLength()

    if (remaining < length + HEADER_SIZE) return

    return {
      code: this._readCode(),
      body: this._readBody(length)
    }
  }

  /**
   * Read the packet code
   * 
   * @private
   */
  _readCode () {
    return this._buffer[this._offset++]
  }

  /**
   * Read the packet length
   * 
   * @private
   */
  _readLength () {
    return this._buffer.readUInt32BE(this._offset + CODE_SIZE) - LENGTH_SIZE
  }

  /**
   * Read the packet body
   * 
   * @param {number} size 
   * @private
   */
  _readBody (size) {
    return this._buffer.slice(this._offset += LENGTH_SIZE, this._offset += size)
  }
}

// export
module.exports = {
  MessageReader
}
