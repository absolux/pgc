
'use strict'

import { Queue } from './queue'

export class Manager {
  /**
   * 
   * @param {{ size?: number, factory: () => Any }} options 
   */
  constructor ({ factory, size = 10 }) {
    this._resources = new Array(size)
    this._available = new Queue()
    this._factory = factory
    this._size = size
    this._offset = 0
  }

  shift () {
    return this._available.shift() || this._create()
  }

  push (resource) {
    this._available.push(resource)
  }

  drop (resource) {
    let index = this._resources.indexOf(resource)

    if (index >= 0) {
      this._resources.splice(index, 1)
      this._offset--
    }
  }

  _create () {
    if (this._offset >= this._size) return

    let resource = this._factory.call(null)

    return this._resources[this._offset++] = resource
  }
}
