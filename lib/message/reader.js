
'use strict'

const Reader = require('packet-reader')


class MessageReader {
  constructor () {
    this._reader = new Reader({
      lengthPadding: -4,
      headerSize: 1
    })
  }

  /**
   * 
   * 
   * @param {Buffer} chunk 
   * @public
   */
  use (chunk) {
    this._reader.addChunk(chunk)
    return this
  }

  /**
   * 
   * @public
   */
  read () {
    let packet = this._reader.read()

    if (packet) {
      return {
        head: this._reader.header,
        size: packet.length + 4,
        body: packet
      }
    }
  }
}

// export
module.exports = {
  MessageReader
}
