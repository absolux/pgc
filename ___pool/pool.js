
'use strict'

import { Queue } from './queue'
import { Request } from './request'

export class Pool {
  constructor (manager) {
    this.resources = manager
    this.requests = new Queue()
  }

  acquire () {
    setImmediate(() => this.dequeue())

    return this.enqueue().promise()
  }

  release (resource) {
    setImmediate(() => this.dequeue())

    this.resources.push(resource)
  }

  enqueue () {
    let request = new Request()

    this.requests.push(request)

    return request
  }

  dequeue () {
    if (this.requests.isEmpty()) return

    let resource = this.resources.shift()

    if (resource) {
      let request = this.requests.shift()

      request.resolve(resource)
    }
  }
}
