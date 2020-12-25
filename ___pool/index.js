
'use strict'

import { Pool } from './pool'
import { Manager } from './resource'

/**
 * Create a new resource pool
 * 
 * @param {{ factory: { create: () => any }, size?: number }} options 
 */
export function createPool ({ factory, ...options }) {
  return new Pool(new Manager(factory, options))
}
