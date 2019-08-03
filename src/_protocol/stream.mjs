
import { parse } from './parse'
import { MessageReader } from './message-reader'
import { AsyncEmitter } from '../_util/async-emitter'


const TERMINATE_MESSAGE = Buffer.from([
  0x58, 0x00, 0x00, 0x00, 0x04
])


export class Stream extends AsyncEmitter {
  /**
   *
   * @param {Object} options
   */
  constructor (options) {
    super()
    this._options = options
    this._reader = new MessageReader()
  }

  /**
   * Send termination message
   *
   * @public
   * @async
   */
  terminate () {
    this._socket.end(TERMINATE_MESSAGE)
  }

  /**
   * Write a message to the server.
   *
   * @param {Buffer} message
   * @returns {Boolean}
   * @public
   */
  write (message) {
    if (! this._socket.writable) return false

    return this._socket.write(message)
  }

  /**
   * Start listening to secket events
   *
   * @param {Socket} socket
   * @public
   */
  use (socket) {
    this._socket = socket

    socket.on('end', () => this.emit('end'))

    socket.on('data', (chunk) => {
      let packet

      this._reader.append(chunk)

      while (packet = this._reader.read()) {
        let response = parse(packet)

        if (! response) {
          let msg = 'Unsupported server response.'

          this.emit('error', new Error(msg))
          this.terminate()
        }

        this.emit(response.type, response)
        // this.emit('message', response)
      }
    })

    this.emit('connect')
  }
}
