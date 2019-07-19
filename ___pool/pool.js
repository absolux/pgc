
'use strict'

import { Queue } from './queue'
import { Request } from './request'

export class Pool {
  constructor (manager) {
    this._requests = new Queue()
    this._resources = manager
  }

  acquire () {
    let request = this._enqueue()

    this._dequeue()

    return request.promise()
  }

  release (resource) {
    this._resources.push(resource)
    this._dequeue()
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
