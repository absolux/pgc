
'use strict'

import { Queue } from './queue'

export class Manager {
  /**
   * 
   * @param {{ size?: number, factory: () => any }} options 
   */
  constructor ({ factory, size = 10 }) {
    this.available = new Queue()
    this.factory = factory
    this.resources = []
    this.max = size
  }

  shift () {
    return this.available.shift() || this.create()
  }

  push (resource) {
    this.available.push(resource)
  }

  drop (resource) {
    let index = this.resources.indexOf(resource)

    if (~index) this.resources.splice(index, 1)
  }

  create () {
    if (this.available.length >= this.max) return

    let resource = this.factory.call(null)

    this.resources.push(resource)
    
    return resource
  }
}
