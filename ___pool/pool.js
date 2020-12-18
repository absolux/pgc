
'use strict'

import { Queue } from './queue'
import { Request } from './request'

export class Pool {
  constructor (manager) {
    this._requests = new Queue()
    this._resources = manager
  }

  acquire () {
    setImmediate(() => this._dequeue())

    return this._enqueue().promise()
  }

  release (resource) {
    setImmediate(() => this._dequeue())

    this._resources.push(resource)
  }

  _enqueue () {
    let request = new Request()

    this._requests.push(request)

    return request
  }

  _dequeue () {
    if (this._requests.isEmpty()) return

    let resource = this._resources.shift()

    if (resource) {
      let request = this._requests.shift()

      request.resolve(resource)
    }
  }
}
