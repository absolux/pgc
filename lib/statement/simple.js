
'use strict'

const { StatementError } = require('./error')
const { AbstractStatement } = require('./abstract')
const { createQueryMessage } = require('../message/factory')

/**
 * Simple query handler
 * 
 * @class
 */
class SimpleStatement extends AbstractStatement {
  /**
   * Execute the given sql command and start listening for results.
   * 
   * @param {String} query 
   * @public
   */
  execute (query) {
    this._connection.lock()
    this._listenExecuteEvents()
    this._writeQueryMessage(query)

    return this
  }

  /**
   * Write the simple query message.
   * 
   * @param {String} sql 
   * @private
   */
  _writeQueryMessage (sql) {
    this._connection.write(createQueryMessage(sql))
  }

  /**
   * Start listening for execution events.
   * 
   * @private
   */
  _listenExecuteEvents () {
    let con = this._connection

    const onError = (response) => {
      this.emit('error', StatementError.from(response))
    }

    const onRow = ({ values }) => this.emit('row', values)
    const onFields = ({ fields }) => this.emit('fields', fields)
    const onConnectionError = (error) => this.emit('error', error)
    const onComplete = ({ type, ...info }) => this.emit('end', info)

    con.on('PG:Error', onError)
    con.on('PG:DataRow', onRow)
    con.on('error', onConnectionError)
    con.on('PG:EmptyQuery', onComplete)
    con.on('PG:RowDescription', onFields)
    con.on('PG:CommandComplete', onComplete)

    con.once('PG:ReadyForQuery', () => {
      con.removeListener('PG:Error', onError)
      con.removeListener('PG:DataRow', onRow)
      con.removeListener('error', onConnectionError)
      con.removeListener('PG:EmptyQuery', onComplete)
      con.removeListener('PG:CommandComplete', onComplete)

      con.unlock()

      // shut down
      this.removeAllListeners()
    })
  }
}

// export
module.exports = {
  SimpleStatement
}
