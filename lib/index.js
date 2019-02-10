
'use strict'

const { Connection, ConnectionError } = require('./connection')
const { Statement, StatementError } = require('./statement')
const { Client } = require('./client')

const defaults = {
  client_encoding: 'utf8' // or latin1
}

/**
 * Client factory
 * 
 * @param {object} options 
 * @public
 */
function createClient (options) {
  return new Client({ ...defaults, ...options })
}

// export
module.exports = {
  ConnectionError,
  StatementError,
  createClient,
  Connection,
  Statement,
  Client,
}
