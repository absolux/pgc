
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
   * @param {object} options 
   */
  constructor (connection, { encoding }) {
    super()

    this._extended    = false
    this._connection  = connection
    this._writer      = new MessageWriter(encoding)
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
    let conn = this._connection

    const onComplete = ({ type, ...info }) => {
      this.emit('complete', info)
      this._sendSyncMessage()
    }

    const onError = (response) => {
      this.emit('error', StatementError.from(response))
      this._sendSyncMessage()
    }

    const onEmptyQuery = () => {
      this.emit('error', new StatementError('The query was empty!'))
      this._sendSyncMessage()
    }

    const onNotice = (msg) => this.emit('warning', msg)
    const onRow = ({ values }) => this.emit('row', values)
    const onFields = ({ fields }) => this.emit('fields', fields)
    const onConnectionError = (error) => this.emit('error', error)

    conn.on('PG:Error', onError)
    conn.on('PG:DataRow', onRow)
    conn.on('PG:Notice', onNotice)
    conn.on('error', onConnectionError)
    conn.on('PG:EmptyQuery', onEmptyQuery)
    conn.on('PG:RowDescription', onFields)
    conn.on('PG:CommandComplete', onComplete)

    conn.once('PG:ReadyForQuery', () => {
      conn.removeListener('PG:Error', onError)
      conn.removeListener('PG:DataRow', onRow)
      conn.removeListener('PG:Notice', onNotice)
      conn.removeListener('error', onConnectionError)
      conn.removeListener('PG:EmptyQuery', onEmptyQuery)
      conn.removeListener('PG:RowDescription', onFields)
      conn.removeListener('PG:CommandComplete', onComplete)

      conn.unlock()

      // finish
      this.emit('end')
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
