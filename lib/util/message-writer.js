
'use strict'

const START_POSITION = 0

// const FLUSH_MESSAGE = Buffer.from([
//   0x48, 0x00, 0x00, 0x00, 0x04
// ])

class MessageWriter {
  /**
   * 
   * @param {string} [encoding] text encoding
   * @param {number} [size] Initial buffer size
   */
  constructor (encoding = 'utf8', size = 1024) {
    this._encoding = encoding
    this._buffer = Buffer.alloc(size)
    this._start = this._offset = START_POSITION
  }

  /**
   * Get the buffered messages, then reset the writer.
   * 
   * @returns {Buffer}
   * @public
   */
  flush () {
    let buffer = this._buffer.slice(START_POSITION, this._offset)

    // reset
    this._start = this._offset = START_POSITION

    return buffer
  }

  /**
   * Write the "Startup" message.
   * 
   * @param {object} params 
   * @public
   */
  writeStartupMessage (params) {
    this._begin()

    this._writeInt16(3)._writeInt16(0)  // protocol version 3.0

    for (let key in params) {
      this._writeCString(key)._writeCString(params[key])
    }

    this._writeCString('')              // terminator

    return this._end()
  }

  /**
   * Write the "Password" message.
   * 
   * @param {string} value 
   * @public
   */
  writePasswordMessage (value) {
    return this._begin(0x70)._writeCString(value)._end()
  }

  /**
   * Write the "Query" message
   * 
   * @param {string} command 
   * @public
   */
  writeQueryMessage (command) {
    return this._begin(0x51)._writeCString(command)._end()
  }

  /**
   * Write the "Parse" message.
   * 
   * @param {string} sql The command statement
   * @param {string} [name] The statement name
   * @private
   */
  writeParseMessage (sql, name = '') {
    return this._begin(0x50)
      ._writeCString(name)              // statement name
      ._writeCString(sql)               // sql command
      ._writeInt16(0)                   // no parameter types
      ._end()
  }

  /**
   * Write the "Bind" message.
   * 
   * @param {(null | string | Buffer)[]} params 
   * @param {string} [portal] The portal name
   * @param {string} [statement] The statement name
   * @public
   */
  writeBindMessage (params, portal = '', statement = '') {
    this._begin(0x42)

    this._writeCString(portal)._writeCString(statement)

    // input formats count
    this._writeInt16(params.length)

    // input formats : '0' for text, '1' for binary
    params.forEach((value) => {
      this._writeInt16(Buffer.isBuffer(value))
    })

    // params count
    this._writeInt16(params.length)

    // values
    params.forEach((value) => {
      if (value == null) return this._writeInt32(-1)

      if (Buffer.isBuffer(value)) {
        this._writeInt32(value.length)
        this._append(value)
      }
      else {
        this._writeInt32(Buffer.byteLength(value))
        this._writeString(value)
      }
    })

    // output format : '0' for text
    this._writeInt16(0)

    return this._end()
  }

  /**
   * Write the "Describe" message.
   * 
   * @param {string} type 'P' for portal, 'S' for statement
   * @param {string} [name] The portal or statement name
   * @public
   */
  writeDescribeMessage (type, name = '') {
    return this._begin(0x44)._writeCString(type + name)._end()
  }

  /**
   * Write the "Execute" message.
   * 
   * @param {string} [portal] The portal name
   * @param {number} [max] The maximum result number
   * @private
   */
  writeExecuteMessage (portal = '', max = 0) {
    this._begin(0x45)
      ._writeCString(portal)          // portal name
      ._writeInt32(max)               // maximum count of results
      ._end()
  }

  /**
   * Write the "Flush" message.
   * 
   * @public
   */
  writeFlushMessage () {
    return this._begin(0x48)._end()
    // return this._writeBytes(FLUSH_MESSAGE)
  }

  /**
   * Resize the internal buffer if not enough size left.
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

    return size
  }

  /**
   * Start a new message with header code
   * 
   * @param {number} [code] 
   * @private
   */
  _begin (code) {
    this._ensure(5)

    if (code) this._buffer.writeUInt8(code, this._offset++)

    this._start = this._offset
    this._offset += 4 // length size is always 4 bytes

    return this
  }

  /**
   * Write the message length
   * 
   * @private
   */
  _end () {
    let length = this._offset - this._start

    this._buffer.writeUInt32BE(length, this._start, true)

    return this
  }

  /**
   * 
   * @param {number} value 
   * @public
   */
  _writeInt16 (value) {
    this._ensure(2)
    this._offset = this._buffer.writeInt16BE(value, this._offset, true)
    return this
  }

  /**
   * 
   * @param {number} value 
   * @public
   */
  _writeInt32 (value) {
    this._ensure(4)
    this._offset = this._buffer.writeInt32BE(value, this._offset, true)
    return this
  }

  /**
   * 
   * @param {string} value 
   * @public
   */
  _writeString (value) {
    let length = Buffer.byteLength(value, this._encoding)

    this._ensure(length)
    this._buffer.write(value, this._offset, length, this._encoding)
    this._offset += length
    return this
  }

  /**
   * 
   * @param {string} value 
   * @private
   */
  _writeCString (value) {
    this._writeString(value)
    this._buffer.writeUInt8(0, this._offset++, true)
    return this
  }

  /**
   * Copy the buffer content into the internal buffer.
   * 
   * @param {Buffer} buffer 
   * @private
   */
  _writeBytes (buffer) {
    this._ensure(buffer.length)
    buffer.copy(this._buffer, this._offset)
    this._offset += buffer.length
    return this
  }
}

// export
module.exports = {
  MessageWriter
}
