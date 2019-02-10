
'use strict'

const { Duplex } = require('stream')
const { Statement } = require('./statement')
const parsers = require('./util/message-parser')
const { AsyncEmitter } = require('./util/async-emitter')
const { MessageReader } = require('./util/message-reader')


const TERMINATE_MESSAGE = Buffer.from([
  0x58, 0x00, 0x00, 0x00, 0x04
])

const STATE_CONNECTED = 1
const STATE_IDLE      = 3
const STATE_BUSY      = 6
const STATE_CLOSED    = 9


class ConnectionError extends Error {
  /**
   * Create a connection error from a previous error
   * 
   * @param {Error} error 
   */
	static from (error) {
		let instance = new ConnectionError(error.message)

		instance.previous = error

		return instance
	}
}


class Connection extends AsyncEmitter {
  /**
   * Initialize a new database connection.
   * 
   * @param {Duplex} stream 
   * @param {object} options 
   */
  constructor (stream, options) {
    super()

    this._stream = stream
    this._encoding = 'utf8'
    this._options = options
    this._state = STATE_CLOSED
    this._reader = new MessageReader()

    stream.on('error', (error) => {
      error = ConnectionError.from(error)

      this.emit('error', error)
      this.close()
    })
  }

  /**
   * Set the connection encoding.
   * 
   * @param {string} value 
   * @public
   */
  setEncoding (value) {
    this._encoding = value
    return this
  }

  /**
   * Attempt to connect to PostgreSQL server.
   * 
   * @public
   */
  connect () {
    if (this._state !== STATE_CLOSED) {
      throw new ConnectionError('The connection is already opened.')
    }

    let socket = this._stream
    let { port, host, keepAlive, ssl } = this._options

    socket.connect(port, host, () => {
      if (keepAlive) socket.setKeepAlive(true)

      if (! ssl) {
        this._state = STATE_CONNECTED
        this._startListeningEvents()
        return this.emit('connect')
      }

      // TODO: request SSL
    })

    return this
  }

  /**
   * Terminate the connection.
   * 
   * @public
   */
  close () {
    if (this._state === STATE_CLOSED) return

    this._stream.end(TERMINATE_MESSAGE)
    this._state = STATE_CLOSED
  }

  /**
   * Execute the query command(s).
   * 
   * @param {String} command 
   * @param {(null | string | Buffer)[]} [params] 
   * @param {object} [options] 
   * @returns {Statement}
   * @public
   */
  execute (command, params, options = { encoding: this._encoding }) {
    return new Statement(this, options).execute(command, params)
  }

  /**
   * Stop accepting queries.
   * 
   * @public
   */
  lock () {
    if (this._state !== STATE_IDLE) {
      throw new ConnectionError('The connection is not yet ready for queries.')
    }

    this._state = STATE_BUSY
  }

  /**
   * Start accepting queries.
   * 
   * @public
   */
  unlock () {
    this._state = STATE_IDLE
    this.emit('ready')
  }

  /**
   * Write a message to the server.
   * 
   * @param {Buffer} message 
   * @returns {Boolean}
   */
  write (message) {
    if (! this._stream.writable) return false

    return this._stream.write(message)
  }

  /**
   * Start listening to secket events
   * 
   * @private
   */
  _startListeningEvents () {
    this._stream.on('end', () => {
      if (this._state !== STATE_CLOSED) {
        this._state = STATE_CLOSED

        let msg = 'Connection terminated unexpectedly.'

        this.emit('error', new ConnectionError(msg))
      }
    })

    this._stream.on('data', (chunk) => {
      let packet

      this._reader.append(chunk)

      while (packet = this._reader.read()) {
        let response = this._parse(packet)

        if (! response) {
          let msg = `Unsupported server response.`
          let error = new ConnectionError(msg)

          this.emit('error', error)
          return this.close()
        }

        this.emit(response.type, response)
        this.emit('message', response)
      }
    })

    this._stream.on('close', (hadError) => {
      this.emit('close', hadError)
    })
  }

  /**
   * Parse the incoming packet to a response object.
   * 
   * @param {object} packet 
   * @returns {object}
   * @private
   */
  _parse ({ code, body }) {
    let fn = parsers[code]

    if (fn) return fn(body)
  }
}

// export
module.exports = {
  ConnectionError,
  Connection
}
