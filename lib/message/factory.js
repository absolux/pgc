
'use strict'

const { createHash } = require('crypto')
const { MessageWriter } = require('./writer')


/**
 * Create the initial start up message.
 * 
 * @param {object} params 
 * @returns {Buffer}  
 * @public
 */
function createStartupMessage (params) {
  let writer = new MessageWriter()

  writer.writeInt16(3).writeInt16(0) // protocol version

  for (let key in params) {
    writer.writeCString(key).writeCString(params[key])
  }

  return writer.writeCString('').flush()
}

/**
 * Create a plain text password message.
 * 
 * @param {String} password 
 * @returns {Buffer}
 * @public
 */
function createPasswordMessage (password) {
  return new MessageWriter().writeCString(password).flush(0x70)
}

/**
 * Create a MD5 hashed password message.
 * 
 * @param {String} user 
 * @param {String} password 
 * @param {Buffer} salt 
 * @returns {Buffer}
 * @public
 */
function createMD5PasswordMessage (user, password, salt) {
  return createPasswordMessage(_createHash(user, password, salt))
}

/**
 * Create a simple query message.
 * 
 * @param {String} sql 
 * @returns {Buffer}
 * @public
 */
function createQueryMessage (sql) {
  return new MessageWriter().writeCString(sql).flush(0x51)
}

/**
 * Create the "Parse" message
 * 
 * @param {string} sql 
 * @param {string} name 
 * @returns {Buffer}
 * @public
 */
function createParseMessage (sql, name) {
  let writer = new MessageWriter()

  writer.writeCString(name).writeCString(sql)

  return writer.writeInt16(0).flush(0x50)
}

/**
 * Create the "Close" statment message
 * 
 * @param {string} name The prepared statement name
 * @returns {Buffer}
 * @public
 */
function createCloseStatementMessage (name) {
  return _createCloseMessage('S', name)
}

/**
 * Create the "Close" portal message
 * 
 * @param {string} name The portal name
 * @returns {Buffer}
 * @public
 */
function createClosePortalMessage (name) {
  return _createCloseMessage('P', name)
}

/**
 * Create the "Execute" message.
 * 
 * @param {string} portal 
 * @returns {Buffer}
 * @public
 */
function createExecuteMessage (portal) {
  let writer = new MessageWriter(128)

  return writer.writeCString(portal).writeInt32(0).flush(0x45)
}

/**
 * Create the "Describe" portal message.
 * 
 * @param {string} name 
 * @returns {Buffer}
 * @public
 */
function createDescribePortalMessage (name) {
  return _createDescribeMessage('P', name)
}

/**
 * Create the "Bind" message.
 * 
 * @param {(null | string | Buffer)[]} params 
 * @param {string} name 
 * @param {string} portal 
 * @param {boolean} useBinary 
 * @returns {Buffer}
 * @public
 */
function createBindMessage (params, name, portal, useBinary) {
  let writer = new MessageWriter()

  writer.writeCString(portal).writeCString(name)

  writer.writeInt16(params.length)

  // formats
  params.forEach((value) => {
    writer.writeInt16(+Buffer.isBuffer(value))
  })

  writer.writeInt16(params.length)

  // values
  params.forEach((value) => {
    if (value == null) return writer.writeInt16(-1)

    if (Buffer.isBuffer(value)) {
      writer.writeInt32(value.length)
      writer.append(value)
    }
    else {
      value = String(value) // ensure string

      writer.writeInt32(Buffer.byteLength(value))
      writer.writeString(value)
    }
  })

  if (! useBinary) writer.writeInt16(0)
  else writer.writeInt16(1).writeInt16(1)

  return writer.flush(0x42)
}

/**
 * Create the "Describe" message.
 * 
 * @param {string} kind 'S' or 'P'
 * @param {string} name The portal or statement name
 * @returns {Buffer}
 * @private
 */
function _createDescribeMessage (kind, name) {
  let writer = new MessageWriter(128)

  return writer.writeCString(kind + name).flush(0x44)
}

/**
 * Create the "Close" message.
 * 
 * @param {string} kind 'S' or 'P'
 * @param {string} name The portal or statement name
 * @returns {Buffer}
 * @private
 */
function _createCloseMessage (kind, name) {
  let writer = new MessageWriter(128)

  return writer.writeCString(kind + name).flush(0x43)
}

/**
 * Hash the given credentials.
 * 
 * @param {String} user 
 * @param {String} password 
 * @param {Buffer} salt 
 * @returns {String}
 * @private
 */
function _createHash (user, password, salt) {
  let credentials = Buffer.from(_md5(password + user))

  return 'md5' + _md5(Buffer.concat([credentials, salt]))
}

/**
 * Create a MD5 hash string.
 * 
 * @param {String | Buffer} value 
 * @returns {String}
 * @private
 */
function _md5 (value) {
  return createHash('md5').update(value, 'utf8').digest('hex')
}

// export
module.exports = {
  createBindMessage,
  createQueryMessage,
  createParseMessage,
  createExecuteMessage,
  createStartupMessage,
  createPasswordMessage,
  createMD5PasswordMessage,
  createClosePortalMessage,
  createCloseStatementMessage,
  createDescribePortalMessage,
}
