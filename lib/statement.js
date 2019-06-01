
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

    this._extended = false
    this._connection = connection
    this._writer = new MessageWriter(encoding)
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
      // paramterized query
      this._writer.writeParseMessage(command)
      this._writer.writeBindMessage(params)
      this._writer.writeDescribeMessage('P')
      this._writer.writeExecuteMessage()
      this._writer.writeFlushMessage()
      this._extended = true
    }

    this._connection.write(this._writer.flush())

    return this
  }

  /**
   * Start listening for execution events.
   * 
   * @private
   */
  _listenExecuteEvents () {
    let con = this._connection

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

    con.on('PG:Error', onError)
    con.on('PG:DataRow', onRow)
    con.on('PG:Notice', onNotice)
    con.on('error', onConnectionError)
    con.on('PG:EmptyQuery', onEmptyQuery)
    con.on('PG:RowDescription', onFields)
    con.on('PG:CommandComplete', onComplete)

    con.once('PG:ReadyForQuery', () => {
      con.removeListener('PG:Error', onError)
      con.removeListener('PG:DataRow', onRow)
      con.removeListener('PG:Notice', onNotice)
      con.removeListener('error', onConnectionError)
      con.removeListener('PG:EmptyQuery', onEmptyQuery)
      con.removeListener('PG:RowDescription', onFields)
      con.removeListener('PG:CommandComplete', onComplete)

      con.unlock()

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
    if (this._extended) this._connection.write(SYNC_MESSAGE)
  }
}

// export
module.exports = {
  StatementError,
  Statement
}
