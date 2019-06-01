
'use strict'

const { Socket } = require('net')
const { createHash } = require('crypto')
const { MessageWriter } = require('./util/message-writer')
const { Connection, ConnectionError } = require('./connection')

const AUTHENTICATION_OK = 0
const AUTHENTICATION_MD5_PASSWORD = 5
const AUTHENTICATION_CLEARTEXT_PASSWORD = 3

class Client {
  /**
   * Initialize a new database client.
   * 
   * @param {Object} options 
   */
  constructor (options) {
    this._options = options
    this._writer  = new MessageWriter()
  }

  /**
   * Attempt to connect to Postgresql server.
   * 
   * @param {Objcet} options 
   * @returns {Connection}
   * @public
   */
  connect (options) {
    let connection = this._createConnection(options)

    connection.once('connect', () => this._startup(connection))

    return connection.connect()
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

  /**
   * Startup the connection
   * 
   * @param {Connection} connection 
   * @private
   */
  _startup (connection) {
    let { password = '', ...params } = this._options

      const onError = (response) => {
        let error = ConnectionError.from(response)

        connection.emit('error', error)
        connection.close()
      }

      const onAuthentication = (response) => {
        switch (response.method) {
          case AUTHENTICATION_OK:
            // do nothing
            break

          case AUTHENTICATION_MD5_PASSWORD: 
            connection.write(this._createPasswordMessage(
              _createHash(params.user, password, response.salt)
            ))
            break

          case AUTHENTICATION_CLEARTEXT_PASSWORD:
            connection.write(this._createPasswordMessage(password))
            break

          default:
            connection.emit('error', ConnectionError('Authentication method not supported.'))
            connection.close()
        }
      }

      // send startup message
      connection.write(this._createStartupMessage(params))

      // response listening
      connection.on('PG:Error', onError)
      connection.on('PG:Authentication', onAuthentication)

      connection.once('PG:ReadyForQuery', () => {
        connection.off('PG:Authentication', onAuthentication)
        connection.off('PG:Error', onError)
        connection.unlock()
      })
  }

  /**
   * Create the initial start up message.
   * 
   * @param {object} params 
   * @private
   */
  _createStartupMessage (params) {
    return this._writer.writeStartupMessage(params).flush()
  }

  /**
   * Create the password message.
   * 
   * @param {string} value 
   * @private
   */
  _createPasswordMessage (value) {
    return this._writer.writePasswordMessage(value).flush()
  }
}

/**
 * Hash the given credentials.
 * 
 * @param {string} user 
 * @param {string} password 
 * @param {string} salt 
 * @private
 */
function _createHash (user, password, salt) {
  return 'md5' + _md5(_md5(password + user) + salt)
}

/**
 * Create a MD5 hash string.
 * 
 * @param {string} value 
 * @private
 */
function _md5 (value) {
  return createHash('md5').update(value, 'utf8').digest('hex')
}

// export
module.exports = {
  Client
}
