
import { Client } from './client'

const defaults = {
  client_encoding: 'utf8',
  application_name: 'PostgreSQL Node Driver'
}

/**
 * Client factory
 * 
 * @param {object} options 
 * @public
 */
export function createClient (options) {
  return new Client({ ...defaults, ...options })
}

export * from './client'
export * from './statement'
export * from './connection'
