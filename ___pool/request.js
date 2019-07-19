
'use strict'

const NOOP = () => {}

export class Request {
  constructor () {
    // add timeout option

    this._resolve = this._reject = NOOP
  }

  promise () {
    return new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolve (data) {
    this._resolve.call(null, data)
  }

  reject (reason) {
    this._reject.call(null, reason)
  }
}
