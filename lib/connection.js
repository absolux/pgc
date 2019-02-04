
'use strict'

const { parse } = require('./message/parser')
const { MessageReader } = require('./message/reader')
const { SimpleStatement } = require('./statement/simple')
const { AsyncEmitter } = require('./utils/async-emitter')
const { ExtendedStatement } = require('./statement/extended')

const TERMINATE_MESSAGE = Buffer.from([
  0x58, 0x00, 0x00, 0x00, 0x04
])

const STATE_CONNECTED = 1
const STATE_READY     = 3
const STATE_LOCKED    = 6
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
  constructor (stream, options) {
    super()

    this._stream = stream
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
   * Attempt to connect to PostgreSQL server.
   * 
   * @public
   */
  connect () {
    if (this._state !== STATE_CLOSED) {
      throw new ConnectionError('The connection is already opened.')
    }

    let socket = this._stream
    let { port, host, keepAlive } = this._options

    socket.connect(port, host, () => {
      if (keepAlive) socket.setKeepAlive(true)

      this._state = STATE_CONNECTED
      this._startListeningEvents()
      return this.emit('connect')

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

    this._writeTerminateMessage()
    this._state = STATE_CLOSED
  }

  /**
   * Execute the given simple command.
   * 
   * @param {String} query 
   * @returns {SimpleStatement}
   * @public
   */
  execute (query) {
    if (this._state !== STATE_READY) {
      throw new ConnectionError('The connection is not yet ready for queries.')
    }

    let handler = new SimpleStatement(this)

    return handler.execute(query)
  }

  /**
   * Prepare the given query string.
   * 
   * @param {string} query 
   * @param {object} options {name?: string, portal?: string, binary?: boolean}
   * @returns {ExtendedStatement}
   * @public
   */
  prepare (query, options = {}) {
    if (this._state !== STATE_READY) {
      throw new ConnectionError('The connection is not yet ready for queries.')
    }

    let handler = new ExtendedStatement(this, options)

    return handler.prepare(query)
  }

  /**
   * Stop accepting queries.
   * 
   * @public
   */
  lock () {
    this._state = STATE_LOCKED
  }

  /**
   * Start accepting queries.
   * 
   * @public
   */
  unlock () {
    this._state = STATE_READY
    this.emit('ready')
  }

  /**
   * Write a message to the server.
   * 
   * @param {Buffer} message 
   * @returns {Boolean}
   */
  write (message) {
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

      this._reader.use(chunk)

      while (packet = this._reader.read()) {
        let message = parse(packet)

        if (! message) {
          let msg = `Unsupported server message.`
          let error = new ConnectionError(msg)

          this.emit('error', error)
          return this.close()
        }

        this.emit(message.type, message)
        // this.emit('message', message)
      }
    })

    this._stream.on('close', (hadError) => {
      this.emit('close', hadError)
    })
  }

  /**
   * Write the termination message.
   * 
   * @private
   */
  _writeTerminateMessage () {
    this._stream.end(TERMINATE_MESSAGE)
  }
}

// export
module.exports = {
  ConnectionError,
  Connection
}
