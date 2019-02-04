
'use strict'

const { Socket } = require('net')
const { Connection, ConnectionError } = require('./connection')
const { createStartupMessage, createMD5PasswordMessage, createPasswordMessage } = require('./message/factory')


class Client {
  /**
   * Initialize a new database client.
   * 
   * @param {Object} options 
   */
  constructor (options) {
    this._options = options
  }

  /**
   * Attempt to connect to Postgresql server.
   * 
   * @param {Objcet} options 
   * @returns {Connection}
   * @public
   */
  connect (options) {
    let con = this._createConnection(options)

    con.once('connect', () => {
      let { password = '', ...params } = this._options

      // start up
      con.write(createStartupMessage(params))

      // listening
      con.on('PG:Error', onError)
      con.once('PG:ReadyForQuery', onceReady)
      con.on('PG:AuthenticationMD5Password', onMD5Password)
      con.on('PG:AuthenticationCleartextPassword', onPassword)

      function onMD5Password ({ salt }) {
        con.write(createMD5PasswordMessage(params.user, password, salt))
      }

      function onError (response) {
        let error = ConnectionError.from(response)

        con.emit('error', error)
        con.close()
      }

      function onPassword () {
        con.write(createPasswordMessage(password))
      }

      function onceReady () {
        // clean up
        con.removeListener('PG:Error', onError)
        con.removeListener('PG:AuthenticationMD5Password', onMD5Password)
        con.removeListener('PG:AuthenticationCleartextPassword', onPassword)

        con.unlock()
      }
    })

    return con.connect()
  }

  /**
   * Create a new connection object.
   * 
   * @params {Object} options
   * @returns {Connection}
   * @private
   */
  _createConnection (options) {
    return new Connection(new Socket(), options)
  }
}

// export
module.exports = {
  Client
}
