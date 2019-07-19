
'use strict'

import { Pool } from './pool'
import { Manager } from './resource'

/**
 * Create a new resource pool
 * 
 * @param {{ size?: number, factory: () => any }} options 
 */
export function createPool (options) {
  return new Pool(new Manager(options))
}
