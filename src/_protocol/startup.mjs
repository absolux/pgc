
import crypto from 'crypto'
import { toError } from '../_util/helpers'
import { MessageWriter } from './message-writer'


const AUTHENTICATION_OK = 0
const AUTHENTICATION_MD5_PASSWORD = 5
const AUTHENTICATION_CLEARTEXT_PASSWORD = 3


export function startup (stream, { password = '', ...params }) {
  let writer = new MessageWriter()

  function onError (response) {
    stream.emit('error', toError(response))
    stream.terminate()
  }

  function onAuthentication (response) {
    switch (response.method) {
      case AUTHENTICATION_OK:
        // do nothing
        break

      case AUTHENTICATION_MD5_PASSWORD: 
        stream.write(createPasswordMessage(
          _createHash(params.user, password, response.salt)
        ))
        break

      case AUTHENTICATION_CLEARTEXT_PASSWORD:
        stream.write(createPasswordMessage(password))
        break

      default:
        let msg = 'Authentication method not supported.'

        stream.emit('error', new Error(msg))
        stream.terminate()
    }
  }

  function createStartupMessage (params) {
    return writer.writeStartupMessage(params).flush()
  }

  function createPasswordMessage (value) {
    return writer.writePasswordMessage(value).flush()
  }

  // send startup message
  stream.write(createStartupMessage(params))

  // response listening
  stream.on('PG:Error', onError)
  stream.on('PG:Authentication', onAuthentication)

  stream.once('PG:ReadyForQuery', () => {
    stream.off('PG:Authentication', onAuthentication)
    stream.off('PG:Error', onError)
  })
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
export function _md5 (value) {
  return crypto.createHash('md5').update(value, 'utf8').digest('hex')
}
