
'use strict'

const { AbstractStatement } = require('./abstract')
const { createParseMessage, createCloseStatementMessage,
        createExecuteMessage, createDescribePortalMessage,
        createBindMessage } = require('../message/factory')


const EMPTY_BUFFER = Buffer.alloc(0)

const FLUSH_MESSAGE = Buffer.from([
  0x48, 0x00, 0x00, 0x00, 0x04
])

const SYNC_MESSAGE = Buffer.from([
  0x53, 0x00, 0x00, 0x00, 0x04
])


/**
 * Extended query handler.
 * 
 * @class
 */
class ExtendedStatement extends AbstractStatement {
  /**
   * 
   * @param {Connection} connection 
   * @param {{ name?: string, portal?: string, binary?: boolean }} options 
   */
  constructor (connection, { name = '', portal = '', binary = false }) {
    super(connection)

    this._name = name
    this._portal = portal
    this._binary = binary
    this._parseMessage = EMPTY_BUFFER
  }

  /**
   * Prepare 
   * 
   * @param {string} query 
   * @public
   */
  prepare (query) {
    this._parseMessage = createParseMessage(query, this._name)

    return this
  }

  /**
   * Execute the prepared statement.
   * 
   * @param {(null | string | Buffer)[]} params 
   * @public
   */
  execute (params) {
    this._connection.lock()
    this._listenExecuteEvents()
    this._writeExecuteMessage(params)

    return this
  }

  /**
   * Close this prepared statement.
   * 
   * @public
   */
  destroy () {
    this._connection.write(createCloseStatementMessage(this._name))
  }

  _writeExecuteMessage (params) {
    let message = Buffer.concat([
      this._parseMessage,
      createBindMessage(params, this._name, this._portal, this._binary),
      createDescribePortalMessage(this._portal),
      createExecuteMessage(this._portal),
      FLUSH_MESSAGE
    ])

    this._connection.write(message)
  }

  /**
   * Start listening for execution events.
   * 
   * @param {object} options 
   * @private
   */
  _listenExecuteEvents () {
    let con = this._connection

    const onError = (response) => {
      this._connection.write(SYNC_MESSAGE)
      this.emit('error', StatementError.from(response))
    }

    const onComplete = ({ type, ...info }) => {
      this._connection.write(SYNC_MESSAGE)
      this.emit('end', info)
    }

    const onParseComplete = () => {
      this._parseMessage = EMPTY_BUFFER
    }

    const onRow = ({ values }) => this.emit('row', values)
    const onFields = ({ fields }) => this.emit('fields', fields)
    const onConnectionError = (error) => this.emit('error', error)

    con.on('PG:Error', onError)
    con.on('PG:DataRow', onRow)
    con.on('error', onConnectionError)
    con.on('PG:EmptyQuery', onComplete)
    con.on('PG:RowDescription', onFields)
    con.on('PG:CommandComplete', onComplete)
    con.once('PG:ParseComplete', onParseComplete)

    con.once('PG:ReadyForQuery', () => {
      con.removeListener('PG:Error', onError)
      con.removeListener('PG:DataRow', onRow)
      con.removeListener('error', onConnectionError)
      con.removeListener('PG:EmptyQuery', onComplete)
      con.removeListener('PG:RowDescription', onFields)
      con.removeListener('PG:CommandComplete', onComplete)

      con.unlock()

      // shut down
      this.removeAllListeners()
    })
  }
}

// export
module.exports = {
  ExtendedStatement
}
