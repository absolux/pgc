
import { startup, connect } from './_protocol'
import { Connection } from './connection';

export class Client {
  constructor (options) {
    this._database = options
  }

  connect (options) {
    let stream = connect(options)

    stream.once('connect', () => {
      startup(stream, this._database)
    })

    return new Connection(stream)
  }
}
