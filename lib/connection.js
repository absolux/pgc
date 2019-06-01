
'use strict'

const tls = require('tls')
const { Statement } = require('./statement')
const parsers = require('./util/message-parser')
const { AsyncEmitter } = require('./util/async-emitter')
const { MessageReader } = require('./util/message-reader')

const TERMINATE_MESSAGE = Buffer.from([
  0x58, 0x00, 0x00, 0x00, 0x04
])

const REQUEST_SSL_MESSAGE = Buffer.from([
  0x00, 0x00, 0x00, 0x04, 0x04, 0xD2, 0x16, 0x2F
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
   * @param {Object} options 
   */
  constructor (stream, { keepAlive = false, secure = false, ...options }) {
    super()

    this._socket    = stream
    this._secure    = secure
    this._options   = options
    this._keepAlive = keepAlive
    this._state     = STATE_CLOSED
    this._reader    = new MessageReader()
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

    const onError = (error) => {
      this.emit('error', ConnectionError.from(error))
      this.close()
    }

    this._socket.connect(this._options, () => {
      if (this._keepAlive) this._socket.setKeepAlive(true)

      if (! this._secure) {
        this._state = STATE_CONNECTED
        this._startListeningEvents()

        return this.emit('connect')
      }

      // send SSL request
      this.write(REQUEST_SSL_MESSAGE)

      this._socket.once('data', (buffer) => {
        let response = buffer.toString()

        if (response === 'N') {
          let msg = `The server does not support SSL connections`

          return this.emit('error', new ConnectionError(msg))
        }

        if (response !== 'S') {
          let msg = `There was an error establishing a SSL connection`

          return this.emit('error', new ConnectionError(msg))
        }

        // continue with a secure connection
        this._socket = tls.connect(this._options, () => {
          this._state = STATE_CONNECTED
          this._startListeningEvents()
          this.emit('connect')
        })

        this._socket.on('error', onError)
      })
    })

    this._socket.on('error', onError)

    return this
  }

  /**
   * Terminate the connection.
   * 
   * @public
   */
  close () {
    if (this._state === STATE_CLOSED) return

    this._socket.end(TERMINATE_MESSAGE)
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
  execute (command, params, options = { encoding: 'utf8' }) {
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
    if (! this._socket.writable) return false

    return this._socket.write(message)
  }

  /**
   * Start listening to secket events
   * 
   * @private
   */
  _startListeningEvents () {
    this._socket.on('end', () => {
      if (this._state !== STATE_CLOSED) {
        this._state = STATE_CLOSED

        let msg = 'Connection terminated unexpectedly.'

        this.emit('error', new ConnectionError(msg))
      }
    })

    this._socket.on('data', (chunk) => {
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

    this._socket.on('close', (hadError) => {
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
    let parse = parsers[code]

    if (parse) return parse(body)
  }
}

// export
module.exports = {
  ConnectionError,
  Connection
}
