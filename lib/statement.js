
'use strict'

const { AsyncEmitter } = require('./util/async-emitter')
const { MessageWriter } = require('./util/message-writer')

const SYNC_MESSAGE = Buffer.from([
  0x53, 0x00, 0x00, 0x00, 0x04
])

class StatementError extends Error {
  /**
   * 
   * @param {Error} error 
   */
	static from (error) {
		let instance = new StatementError(error.message)

		instance.previous = error

		return instance
	}
}

class Statement extends AsyncEmitter {
  /**
   * Initialize a new statement instance.
   * 
   * @param {Connection} connection 
   */
  constructor (connection) {
    super()

    this._extended    = false
    this._connection  = connection
    this._writer      = new MessageWriter()
  }

  /**
   * Execute the query command.
   * 
   * @param {string} command 
   * @param {(null | string | Buffer)[]} params 
   * @public
   */
  execute (command, params = []) {
    this._connection.lock()
    this._listenExecuteEvents()

    if (params.length === 0) {
      // simple query
      this._writer.writeQueryMessage(command)
    }
    else {
      // extended query
      this._writer.writeParseMessage(command)
      this._writer.writeBindMessage(params)
      this._writer.writeDescribeMessage('P')
      this._writer.writeExecuteMessage()
      this._writer.writeFlushMessage()
      this._extended = true
    }

    this._write(this._writer.flush())

    return this
  }

  /**
   * Start listening for execution events.
   * 
   * @private
   */
  _listenExecuteEvents () {
    const onComplete = ({ command, rowCount }) => {
      this.emit('complete', { command, rowCount })
      this._sendSyncMessage()
    }

    const onError = (response) => {
      this.emit('error', StatementError.from(response))
      this._sendSyncMessage()
    }

    const onEmptyQuery = () => {
      this.emit('error', new StatementError('The query was empty !'))
      this._sendSyncMessage()
    }

    const onNotice = (msg) => this.emit('notice', msg)
    const onRow = ({ values }) => this.emit('row', values)
    const onFields = ({ fields }) => this.emit('fields', fields)
    const onConnectionError = (error) => this.emit('error', error)

    this._connection.on('PG:Error', onError)
    this._connection.on('PG:DataRow', onRow)
    this._connection.on('PG:Notice', onNotice)
    this._connection.on('error', onConnectionError)
    this._connection.on('PG:EmptyQuery', onEmptyQuery)
    this._connection.on('PG:RowDescription', onFields)
    this._connection.on('PG:CommandComplete', onComplete)

    this._connection.once('PG:ReadyForQuery', () => {
      this._connection.off('PG:CommandComplete', onComplete)
      this._connection.off('PG:RowDescription', onFields)
      this._connection.off('PG:EmptyQuery', onEmptyQuery)
      this._connection.off('error', onConnectionError)
      this._connection.off('PG:Notice', onNotice)
      this._connection.off('PG:DataRow', onRow)
      this._connection.off('PG:Error', onError)

      // finish
      this._connection.unlock()
      this.removeAllListeners()
    })
  }

  /**
   * Send the "Sync" message.
   * 
   * @private
   */
  _sendSyncMessage () {
    if (this._extended) this._write(SYNC_MESSAGE)
  }

  /**
   * Write message
   * 
   * @param {Buffer} message 
   * @private
   */
  _write (message) {
    return this._connection.write(message)
  }
}

// export
module.exports = {
  StatementError,
  Statement
}
